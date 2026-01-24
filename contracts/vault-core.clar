;; vault-core
;; A simple STX vault that allows users to deposit and withdraw STX

;; Error codes
(define-constant ERR-INSUFFICIENT-BALANCE (err u101))
(define-constant ERR-INVALID-AMOUNT (err u102))

;; Data maps
(define-map user-deposits principal uint)
(define-data-var total-deposits uint u0)

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

;; Read-only functions

;; Get user's deposit balance
(define-read-only (get-user-deposit (user principal))
  (default-to u0 (map-get? user-deposits user))
)

;; Get total deposits in the vault
(define-read-only (get-total-deposits)
  (var-get total-deposits)
)
