import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * 화면이 하얗게 뜨면 원인을 알 길이 없어, 터진 자리를 그대로 보여준다.
 * 개발자도구를 열지 않고도 무엇이 잘못됐는지 읽을 수 있게 하려는 것.
 */
export class ErrorScreen extends Component<{ children: ReactNode }, { err: Error | null; where: string }> {
  state = { err: null as Error | null, where: '' }

  static getDerivedStateFromError(err: Error) {
    return { err, where: '' }
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    this.setState({ err, where: info.componentStack ?? '' })
    console.error(err)
  }

  render() {
    const { err, where } = this.state
    if (!err) return this.props.children
    return (
      <div className="crash">
        <h1>화면을 그리다 멈췄어요</h1>
        <p className="crash-msg">{err.message}</p>
        {err.stack && <pre>{err.stack}</pre>}
        {where && <pre className="crash-where">{where}</pre>}
        <button onClick={() => location.reload()}>새로고침</button>
        <p className="crash-tip">
          이 내용을 그대로 복사해서 보여주면 돼요.
          저장된 마을 때문일 수도 있으니, 계속 같은 화면이면 아래를 눌러보세요.
        </p>
        <button
          className="ghost"
          onClick={() => {
            try { localStorage.removeItem('moimo.world.v1') } catch { /* noop */ }
            location.reload()
          }}
        >
          저장된 마을 비우고 새로고침
        </button>
      </div>
    )
  }
}
