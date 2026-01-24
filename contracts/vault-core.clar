;; vault-core
;; A simple STX vault that allows users to deposit and withdraw STX

;; Error codes
(define-constant ERR-INSUFFICIENT-BALANCE (err u101))
(define-constant ERR-INVALID-AMOUNT (err u102))
(define-constant ERR-ALREADY-HAS-LOAN (err u103))
(define-constant ERR-LOAN-NOT-FOUND (err u104))
(define-constant ERR-INSUFFICIENT-COLLATERAL (err u105))
(define-constant ERR-NO-ACTIVE-LOAN (err u106))

;; Constants
(define-constant MIN-COLLATERAL-RATIO u150)

;; Data maps
(define-map user-deposits principal uint)
(define-map user-loans principal { amount: uint, interest-rate: uint, term-end: uint })
(define-data-var total-deposits uint u0)
(define-data-var total-repaid uint u0)

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

;; Get repayment amount for a user's loan
(define-read-only (get-repayment-amount (user principal))
  (match (map-get? user-loans user)
    loan
      (let (
        (term-blocks (* (get interest-rate loan) u144))
        (blocks-elapsed (if (> block-height (get term-end loan))
                          (- (get term-end loan) (- (get term-end loan) term-blocks))
                          (- block-height (- (get term-end loan) term-blocks))))
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
    (term-blocks (* (get interest-rate loan) u144))
    (loan-start (- (get term-end loan) term-blocks))
    (blocks-elapsed (- block-height loan-start))
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
