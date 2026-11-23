import LoginBrandSection from './components/LoginBrandSection'
import LoginForm from './components/LoginForm'

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh w-full flex-row bg-white">
      <LoginBrandSection className="w-[calc(100%*7/18)] shrink-0" />
      <section aria-labelledby="login-heading" className="flex min-h-dvh min-w-0 flex-1 items-center justify-center px-ds-24 py-ds-48 lg:px-ds-48">
        <LoginForm />
      </section>
    </main>
  )
}
