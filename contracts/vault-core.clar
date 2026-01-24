;; vault-core
;; A simple STX vault that allows users to deposit and withdraw STX

;; Error codes
(define-constant ERR-INSUFFICIENT-BALANCE (err u101))
(define-constant ERR-INVALID-AMOUNT (err u102))
(define-constant ERR-ALREADY-HAS-LOAN (err u103))
(define-constant ERR-LOAN-NOT-FOUND (err u104))
(define-constant ERR-INSUFFICIENT-COLLATERAL (err u105))
(define-constant ERR-NO-ACTIVE-LOAN (err u106))
(define-constant ERR-NOT-LIQUIDATABLE (err u107))
(define-constant ERR-LIQUIDATE-OWN-LOAN (err u108))

;; Constants
(define-constant MIN-COLLATERAL-RATIO u150)
(define-constant LIQUIDATION-THRESHOLD u110)

;; Data maps
(define-map user-deposits principal uint)
(define-map user-loans principal { amount: uint, interest-rate: uint, start-block: uint, term-end: uint })
(define-data-var total-deposits uint u0)
(define-data-var total-repaid uint u0)
(define-data-var total-liquidations uint u0)

;; Private functions

;; Calculate interest based on principal, rate, and blocks elapsed
(define-private (calculate-interest (principal uint) (rate uint) (blocks-elapsed uint))
  (/ (* (* principal rate) blocks-elapsed) (* u100 u52560))
)

;; Read-only functions

;; Get user's deposit balance
(define-read-only (get-user-deposit (user principal))
  (default-to u0 (map-get? user-deposits user))
)

;; Get total deposits in the vault
(define-read-only (get-total-deposits)
  (var-get total-deposits)
)

;; Get user's loan details
(define-read-only (get-user-loan (user principal))
  (map-get? user-loans user)
)

;; Calculate required collateral for a borrow amount
(define-read-only (calculate-required-collateral (borrow-amount uint))
  (/ (* borrow-amount MIN-COLLATERAL-RATIO) u100)
)

;; Get total amount repaid across all loans
(define-read-only (get-total-repaid)
  (var-get total-repaid)
)

;; Get total liquidations
(define-read-only (get-total-liquidations)
  (var-get total-liquidations)
)

;; Calculate health factor for a user's loan
(define-read-only (calculate-health-factor (user principal) (stx-price uint))
  (match (map-get? user-loans user)
    loan
      (let (
        (user-deposit (default-to u0 (map-get? user-deposits user)))
        (loan-amount (get amount loan))
        (collateral-value (/ (* user-deposit stx-price) u100))
        (health-factor (/ (* collateral-value u100) loan-amount))
      )
        (some health-factor)
      )
    none
  )
)

;; Check if a user's loan is liquidatable
(define-read-only (is-liquidatable (user principal) (stx-price uint))
  (match (calculate-health-factor user stx-price)
    health-factor
      (< health-factor LIQUIDATION-THRESHOLD)
    false
  )
)

;; Get repayment amount for a user's loan
(define-read-only (get-repayment-amount (user principal))
  (match (map-get? user-loans user)
    loan
      (let (
        (blocks-elapsed (- block-height (get start-block loan)))
        (interest (calculate-interest (get amount loan) (get interest-rate loan) blocks-elapsed))
        (total (+ (get amount loan) interest))
      )
        (some { principal: (get amount loan), interest: interest, total: total })
      )
    none
  )
)

;; Public functions

;; Deposit STX into the vault
(define-public (deposit (amount uint))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set user-deposits tx-sender 
      (+ (default-to u0 (map-get? user-deposits tx-sender)) amount))
    (var-set total-deposits (+ (var-get total-deposits) amount))
    (ok true)
  )
)

;; Withdraw STX from the vault
(define-public (withdraw (amount uint))
  (let (
    (user-balance (default-to u0 (map-get? user-deposits tx-sender)))
    (recipient tx-sender)
  )
    (asserts! (>= user-balance amount) ERR-INSUFFICIENT-BALANCE)
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    (map-set user-deposits recipient (- user-balance amount))
    (var-set total-deposits (- (var-get total-deposits) amount))
    (ok true)
  )
)

;; Borrow against deposited collateral
(define-public (borrow (amount uint) (interest-rate uint) (term-days uint))
  (let (
    (user-balance (default-to u0 (map-get? user-deposits tx-sender)))
    (required-collateral (calculate-required-collateral amount))
    (term-end (+ block-height (* term-days u144)))
  )
    ;; Check user doesn't already have an active loan
    (asserts! (is-none (map-get? user-loans tx-sender)) ERR-ALREADY-HAS-LOAN)
    
    ;; Verify user has enough deposited collateral
    (asserts! (>= user-balance required-collateral) ERR-INSUFFICIENT-COLLATERAL)
    
    ;; Store loan details
    (map-set user-loans tx-sender {
      amount: amount,
      interest-rate: interest-rate,
      start-block: block-height,
      term-end: term-end
    })
    
    (ok true)
  )
)

;; Repay an active loan
(define-public (repay)
  (let (
    (loan (unwrap! (map-get? user-loans tx-sender) ERR-NO-ACTIVE-LOAN))
    (loan-amount (get amount loan))
    (blocks-elapsed (- block-height (get start-block loan)))
    (interest (calculate-interest loan-amount (get interest-rate loan) blocks-elapsed))
    (total-repayment (+ loan-amount interest))
  )
    ;; Transfer repayment from user to contract
    (try! (stx-transfer? total-repayment tx-sender (as-contract tx-sender)))
    
    ;; Delete the loan
    (map-delete user-loans tx-sender)
    
    ;; Update total repaid
    (var-set total-repaid (+ (var-get total-repaid) total-repayment))
    
    ;; Return repayment details
    (ok { principal: loan-amount, interest: interest, total: total-repayment })
  )
)

;; Liquidate an undercollateralized loan
(define-public (liquidate (borrower principal) (stx-price uint))
  (let (
    (loan (unwrap! (map-get? user-loans borrower) ERR-NO-ACTIVE-LOAN))
    (borrower-deposit (default-to u0 (map-get? user-deposits borrower)))
    (loan-amount (get amount loan))
    (liquidation-bonus (/ (* loan-amount u5) u100))
    (total-to-pay (+ loan-amount liquidation-bonus))
  )
    ;; Assert caller is not the borrower
    (asserts! (not (is-eq tx-sender borrower)) ERR-LIQUIDATE-OWN-LOAN)
    
    ;; Assert borrower is liquidatable
    (asserts! (is-liquidatable borrower stx-price) ERR-NOT-LIQUIDATABLE)
    
    ;; Transfer payment from liquidator to contract
    (try! (stx-transfer? total-to-pay tx-sender (as-contract tx-sender)))
    
    ;; Transfer borrower's collateral to liquidator
    (try! (as-contract (stx-transfer? borrower-deposit tx-sender borrower)))
    
    ;; Delete borrower's loan
    (map-delete user-loans borrower)
    
    ;; Set borrower's deposit to 0
    (map-set user-deposits borrower u0)
    
    ;; Update total deposits
    (var-set total-deposits (- (var-get total-deposits) borrower-deposit))
    
    ;; Increment liquidation counter
    (var-set total-liquidations (+ (var-get total-liquidations) u1))
    
    ;; Return liquidation details
    (ok { seized-collateral: borrower-deposit, paid: total-to-pay, bonus: liquidation-bonus })
  )
)
