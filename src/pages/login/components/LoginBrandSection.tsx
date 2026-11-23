import background from '../../../assets/login/brand-background.jpg'
import logo from '../../../assets/login/brand-logo.svg'
import illustration from '../../../assets/login/correction-illustration.png'
import { LOGIN_SUPPORT } from '../constants'

/** 로그인 화면의 브랜드 영역. 문구·연락처는 이미지와 분리해 관리한다. */
export default function LoginBrandSection({ className = '' }: { className?: string }) {
  return (
    <section
      aria-label="AUTEDI 소개"
      className={`relative isolate hidden min-h-dvh flex-col justify-between gap-ds-48 overflow-hidden p-ds-60 lg:flex max-xl:px-ds-32 ${className}`}
    >
      <img src={background} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full object-cover" />

      <div className="flex flex-col gap-ds-60">
        <div className="flex items-center gap-ds-8" aria-label="AUTEDI">
          <img src={logo} alt="" className="shrink-0" />
          <span className="font-brand text-h1 font-bold text-text-brand-strong">AUTEDI</span>
        </div>

        <div className="flex flex-col items-center gap-ds-24 py-ds-48">
          <img src={illustration} alt="" aria-hidden="true" width="300" height="300" className="aspect-square w-[300px] max-w-full object-contain" />
          <h2 className="text-center text-h2 text-text-brand-strong">
            첨삭의 부담을 줄이고<br />
            학생에게 집중할 수 있도록
          </h2>
        </div>
      </div>

      <address className="text-caption text-ds-blue-50 not-italic">
        <p>CONTECT</p>
        <p>email: <a href={`mailto:${LOGIN_SUPPORT.email}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">{LOGIN_SUPPORT.email}</a></p>
        <p>tel: <a href={LOGIN_SUPPORT.phoneHref} className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">{LOGIN_SUPPORT.phone}</a></p>
      </address>
    </section>
  )
}
