import { Console, Hook, Unhook } from 'console-feed'
// ref: https://github.com/samdenty/console-feed/issues/57
import type { Message as MessageComponent } from 'console-feed/lib/definitions/Component'
import type { Message as MessageConsole } from 'console-feed/lib/definitions/Console'
import { useEffect,useState } from 'react'

const LogsContainer = () => {
  const [logs, setLogs] = useState<MessageConsole[]>([])

  // run once!
  useEffect(() => {
    const hookedConsole = Hook(
      window.console,
      (log) => setLogs((currLogs) => [...currLogs, log]),
      false,
    )
    return () => { Unhook(hookedConsole) }
  }, [])

  return <Console logs={logs as MessageComponent[]} variant="light" />
}

export { LogsContainer }
