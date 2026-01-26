;; BitFlow Finance - Vault Core (Production Optimized)
;; Source: vault-core.clar
;; Optimized for minimal deployment gas costs

(define-constant ERR-INSUFFICIENT-BALANCE (err u101))
(define-constant ERR-INVALID-AMOUNT (err u102))
(define-constant ERR-ALREADY-HAS-LOAN (err u103))
(define-constant ERR-LOAN-NOT-FOUND (err u104))
(define-constant ERR-INSUFFICIENT-COLLATERAL (err u105))
(define-constant ERR-NO-ACTIVE-LOAN (err u106))
(define-constant ERR-NOT-LIQUIDATABLE (err u107))
(define-constant ERR-LIQUIDATE-OWN-LOAN (err u108))
(define-constant MIN-COLLATERAL-RATIO u150)
(define-constant LIQUIDATION-THRESHOLD u110)
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u109))

(define-map user-deposits principal uint)
(define-map user-loans principal { amount: uint, interest-rate: uint, start-block: uint, term-end: uint })
(define-data-var total-deposits uint u0)
(define-data-var total-repaid uint u0)
(define-data-var total-liquidations uint u0)
(define-data-var total-deposits-count uint u0)
(define-data-var total-withdrawals-count uint u0)
(define-data-var total-borrows-count uint u0)
(define-data-var total-repayments-count uint u0)
(define-data-var total-liquidations-count uint u0)
(define-data-var total-deposit-volume uint u0)
(define-data-var total-borrow-volume uint u0)
(define-data-var total-repay-volume uint u0)
(define-data-var total-liquidation-volume uint u0)
(define-data-var last-activity-block uint u0)
(define-data-var protocol-start-block uint u0)

(define-private (calc-int (p uint) (r uint) (b uint))
  (/ (* (* p r) b) (* u100 u52560))
)

(define-read-only (get-contract-version)
  "1.0.0"
)

(define-read-only (get-user-deposit (user principal))
  (default-to u0 (map-get? user-deposits user))
)

(define-read-only (get-total-deposits)
  (var-get total-deposits)
)

(define-read-only (get-user-loan (user principal))
  (map-get? user-loans user)
)

(define-read-only (calculate-required-collateral (borrow-amount uint))
  (/ (* borrow-amount MIN-COLLATERAL-RATIO) u100)
)

(define-read-only (get-total-repaid)
  (var-get total-repaid)
)

(define-read-only (get-total-liquidations)
  (var-get total-liquidations)
)

(define-read-only (get-protocol-stats)
  {
    total-deposits: (var-get total-deposits),
    total-repaid: (var-get total-repaid),
    total-liquidations: (var-get total-liquidations)
  }
)

(define-read-only (get-max-borrow-amount (user principal))
  (let (
    (user-deposit (default-to u0 (map-get? user-deposits user)))
    (max-borrow (/ (* user-deposit u100) MIN-COLLATERAL-RATIO))
  )
    max-borrow
  )
)

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

(define-read-only (is-liquidatable (user principal) (stx-price uint))
  (match (calculate-health-factor user stx-price)
    health-factor
      (< health-factor LIQUIDATION-THRESHOLD)
    false
  )
)

(define-read-only (get-repayment-amount (user principal))
  (match (map-get? user-loans user)
    loan
      (let (
        (blocks-elapsed (- block-height (get start-block loan)))
        (interest (calc-int (get amount loan) (get interest-rate loan) blocks-elapsed))
        (total (+ (get amount loan) interest))
      )
        (some { principal: (get amount loan), interest: interest, total: total })
      )
    none
  )
)

(define-public (deposit (amount uint))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set user-deposits tx-sender 
      (+ (default-to u0 (map-get? user-deposits tx-sender)) amount))
    (var-set total-deposits (+ (var-get total-deposits) amount))
    (var-set total-deposits-count (+ (var-get total-deposits-count) u1))
    (var-set total-deposit-volume (+ (var-get total-deposit-volume) amount))
    (var-set last-activity-block block-height)
    (ok true)
  )
)

(define-public (withdraw (amount uint))
  (let (
    (user-balance (default-to u0 (map-get? user-deposits tx-sender)))
    (recipient tx-sender)
  )
    (asserts! (>= user-balance amount) ERR-INSUFFICIENT-BALANCE)
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    (map-set user-deposits recipient (- user-balance amount))
    (var-set total-deposits (- (var-get total-deposits) amount))
    (var-set total-withdrawals-count (+ (var-get total-withdrawals-count) u1))
    (var-set last-activity-block block-height)
    (ok true)
  )
)

(define-public (borrow (amount uint) (interest-rate uint) (term-days uint))
  (let (
    (user-balance (default-to u0 (map-get? user-deposits tx-sender)))
    (required-collateral (calculate-required-collateral amount))
    (term-end (+ block-height (* term-days u144)))
  )
    (asserts! (is-none (map-get? user-loans tx-sender)) ERR-ALREADY-HAS-LOAN)
    (asserts! (>= user-balance required-collateral) ERR-INSUFFICIENT-COLLATERAL)
    (map-set user-loans tx-sender {
      amount: amount,
      interest-rate: interest-rate,
      start-block: block-height,
      term-end: term-end
    })
    (var-set total-borrows-count (+ (var-get total-borrows-count) u1))
    (var-set total-borrow-volume (+ (var-get total-borrow-volume) amount))
    (var-set last-activity-block block-height)
    (ok true)
  )
)

(define-public (repay)
  (let (
    (loan (unwrap! (map-get? user-loans tx-sender) ERR-NO-ACTIVE-LOAN))
    (loan-amount (get amount loan))
    (blocks-elapsed (- block-height (get start-block loan)))
    (interest (calc-int loan-amount (get interest-rate loan) blocks-elapsed))
    (total-repayment (+ loan-amount interest))
  )
    (try! (stx-transfer? total-repayment tx-sender (as-contract tx-sender)))
    (map-delete user-loans tx-sender)
    (var-set total-repaid (+ (var-get total-repaid) total-repayment))
    (var-set total-repayments-count (+ (var-get total-repayments-count) u1))
    (var-set total-repay-volume (+ (var-get total-repay-volume) total-repayment))
    (var-set last-activity-block block-height)
    (ok { principal: loan-amount, interest: interest, total: total-repayment })
  )
)

(define-public (liquidate (borrower principal) (stx-price uint))
  (let (
    (loan (unwrap! (map-get? user-loans borrower) ERR-NO-ACTIVE-LOAN))
    (borrower-deposit (default-to u0 (map-get? user-deposits borrower)))
    (loan-amount (get amount loan))
    (liquidation-bonus (/ (* loan-amount u5) u100))
    (total-to-pay (+ loan-amount liquidation-bonus))
  )
    (asserts! (not (is-eq tx-sender borrower)) ERR-LIQUIDATE-OWN-LOAN)
    (asserts! (is-liquidatable borrower stx-price) ERR-NOT-LIQUIDATABLE)
    (try! (stx-transfer? total-to-pay tx-sender (as-contract tx-sender)))
    (try! (as-contract (stx-transfer? borrower-deposit tx-sender borrower)))
    (map-delete user-loans borrower)
    (map-set user-deposits borrower u0)
    (var-set total-deposits (- (var-get total-deposits) borrower-deposit))
    (var-set total-liquidations (+ (var-get total-liquidations) u1))
    (var-set total-liquidations-count (+ (var-get total-liquidations-count) u1))
    (var-set total-liquidation-volume (+ (var-get total-liquidation-volume) borrower-deposit))
    (var-set last-activity-block block-height)
    (ok { seized-collateral: borrower-deposit, paid: total-to-pay, bonus: liquidation-bonus })
  )
)

(define-read-only (get-protocol-metrics)
  {
    total-deposits: (var-get total-deposits-count),
    total-withdrawals: (var-get total-withdrawals-count),
    total-borrows: (var-get total-borrows-count),
    total-repayments: (var-get total-repayments-count),
    total-liquidations: (var-get total-liquidations-count)
  }
)

(define-read-only (get-volume-metrics)
  {
    deposit-volume: (var-get total-deposit-volume),
    borrow-volume: (var-get total-borrow-volume),
    repay-volume: (var-get total-repay-volume),
    liquidation-volume: (var-get total-liquidation-volume)
  }
)

(define-read-only (get-protocol-age)
  (- block-height (var-get protocol-start-block))
)

(define-read-only (get-time-since-last-activity)
  (- block-height (var-get last-activity-block))
)

(define-read-only (get-user-position-summary (user principal) (stx-price uint))
  (let (
    (deposit-amount (default-to u0 (map-get? user-deposits user)))
    (loan-data (map-get? user-loans user))
    (max-borrow (get-max-borrow-amount user))
  )
    {
      deposit-amount: deposit-amount,
      has-loan: (is-some loan-data),
      loan-amount: (match loan-data
        loan-info (get amount loan-info)
        u0
      ),
      loan-interest-rate: (match loan-data
        loan-info (get interest-rate loan-info)
        u0
      ),
      loan-term-end: (match loan-data
        loan-info (get term-end loan-info)
        u0
      ),
      health-factor: (match loan-data
        loan-info (calculate-health-factor user stx-price)
        (some u200)
      ),
      is-liquidatable: (match loan-data
        loan-info (is-liquidatable user stx-price)
        false
      ),
      max-borrow-available: max-borrow,
      collateral-usage-percent: (if (> deposit-amount u0)
        (match loan-data
          loan-info (/ (* (get amount loan-info) u100) deposit-amount)
          u0
        )
        u0
      )
    }
  )
)

(define-public (initialize)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (is-eq (var-get protocol-start-block) u0) err-owner-only)
    (var-set protocol-start-block block-height)
    (var-set last-activity-block block-height)
    (ok true)
  )
)
