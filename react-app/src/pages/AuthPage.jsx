import { Card } from '../components/Card.jsx';
import { Message } from '../components/Message.jsx';

export function AuthPage({ authForm, setAuthForm, authMsg, authLoading, doLogin, doRegister, doReset }) {
  return (
    <div className="page active">
      <section className="auth-shell">
        <Message message={authMsg} />
        {authForm === 'login' ? (
          <Card title="Zaloguj się">
            <form onSubmit={doLogin}>
              <div className="fg"><label>Email</label><input type="email" name="email" placeholder="jan@example.com" autoComplete="email" /></div>
              <div className="fg"><label>Hasło</label><input type="password" name="password" placeholder="••••••••" autoComplete="current-password" /></div>
              <button className="btn-primary" disabled={authLoading === 'login'} type="submit">{authLoading === 'login' ? 'Loguję...' : 'Zaloguj się'}</button>
            </form>
            <hr className="divider" />
            <button className="btn-outline" onClick={() => setAuthForm('register')} type="button">Nie masz konta? Zarejestruj się</button>
            <button className="btn-outline mt-sm" onClick={() => setAuthForm('reset')} type="button">Zapomniałem hasła</button>
          </Card>
        ) : null}
        {authForm === 'register' ? (
          <Card title="Rejestracja">
            <form onSubmit={doRegister}>
              <div className="fg2"><div className="fg"><label>Imię</label><input name="fname" autoComplete="given-name" /></div><div className="fg"><label>Nazwisko</label><input name="lname" autoComplete="family-name" /></div></div>
              <div className="fg"><label>Email</label><input type="email" name="email" autoComplete="email" /></div>
              <div className="fg"><label>Hasło</label><input type="password" name="password" autoComplete="new-password" /></div>
              <div className="fg"><label>Telefon</label><input type="tel" name="phone" autoComplete="tel" /></div>
              <button className="btn-primary" disabled={authLoading === 'register'} type="submit">{authLoading === 'register' ? 'Rejestruję...' : 'Zarejestruj się'}</button>
            </form>
            <hr className="divider" />
            <button className="btn-outline" onClick={() => setAuthForm('login')} type="button">Mam już konto</button>
          </Card>
        ) : null}
        {authForm === 'reset' ? (
          <Card title="Reset hasła">
            <form onSubmit={doReset}>
              <div className="fg"><label>Email</label><input type="email" name="email" autoComplete="email" /></div>
              <button className="btn-primary" disabled={authLoading === 'reset'} type="submit">{authLoading === 'reset' ? 'Wysyłam...' : 'Wyślij link resetujący'}</button>
            </form>
            <hr className="divider" />
            <button className="btn-outline" onClick={() => setAuthForm('login')} type="button">Wróć do logowania</button>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
