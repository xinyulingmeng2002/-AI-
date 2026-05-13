import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-400 text-sm mb-2">页面加载出错</div>
            <div className="text-white/30 text-xs mb-4 max-w-md">{this.state.error?.message}</div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary text-xs"
            >
              重试
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
