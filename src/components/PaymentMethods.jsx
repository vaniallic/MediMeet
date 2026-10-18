import { LuCheck } from 'react-icons/lu'
import { TbCreditCardFilled } from 'react-icons/tb'

/** Payment options with the logos used in the Figma Payment screen. */
export const METHODS = [
  { id: 'QRIS', label: 'QRIS', logo: <img src="/img/ui/qris.png" alt="" className="h-7 w-7" />, qr: true },
  { id: 'GoPay', label: 'Gopay', logo: <img src="/img/ui/gopay.png" alt="gopay" className="h-6 w-auto" />, qr: true },
  { id: 'Virtual Account', label: 'M Banking', logo: <img src="/img/ui/mbank.png" alt="" className="h-8 w-auto" />, qr: false },
  {
    id: 'Card',
    label: 'Cards',
    logo: <TbCreditCardFilled className="h-8 w-8 text-brand" />,
    extra: <img src="/img/ui/cards.png" alt="Visa, Mastercard" className="mt-2 ml-12 h-4 w-auto" />,
    qr: false,
  },
]

export default function PaymentMethods({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Payment method" className="space-y-3">
      {METHODS.map(({ id, label, logo, extra }) => {
        const on = value === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(id)}
            className={`block w-full rounded-2xl px-4 py-3.5 text-left shadow-[0_4px_6px_rgba(0,0,0,0.15)] transition ${
              on ? 'bg-mist ring-2 ring-brand' : 'bg-white hover:bg-mist-light'
            }`}
          >
            <span className="flex items-center gap-4">
              <span className="flex w-auto min-w-8 shrink-0 items-center">{logo}</span>
              <span className="flex-1 text-[15px] text-brand">{label}</span>
              {on && (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-white">
                  <LuCheck className="h-4 w-4" />
                </span>
              )}
            </span>
            {extra}
          </button>
        )
      })}
    </div>
  )
}
