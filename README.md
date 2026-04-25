# codex-session-usage

Codex TUI 하단에 모델, 현재 폴더, 5시간 한도, 주간 한도, 컨텍스트 사용량을 표시하도록 설정하는 설치 도구입니다.

계정 정보나 한도 값을 직접 입력하지 않습니다. 이미 로그인된 Codex 세션을 기준으로 Codex가 제공하는 내장 status line 항목을 켭니다.

## 설치

일반 터미널에서 실행합니다.

```bash
npm install -g github:UrbanWatcherKr/codex-session-usage
codex-session-usage install
```

그 다음 Codex를 완전히 종료했다가 다시 실행합니다.

```bash
codex
```

이후 Codex 하단에 아래 형태의 status line이 표시됩니다.

```text
gpt-5.5 high · ~/project · 5h 27% · weekly 88% · Context 21% used …
```

표시되는 5시간/주간 한도 값은 Codex TUI의 내장 `five-hour-limit`, `weekly-limit` 항목이 보여주는 값입니다.

## 설치 확인

설정 파일에 아래 값이 들어가면 설치된 것입니다.

```toml
[tui]
status_line = [
  "model-with-reasoning",
  "current-dir",
  "five-hour-limit",
  "weekly-limit",
  "context-used",
  "used-tokens"
]
```

설정 파일 위치:

```text
~/.codex/config.toml
```

## 현재 사용률 확인

터미널에서 아래 명령을 실행하면 현재 Codex 계정 기준 사용률을 따로 확인할 수 있습니다.

```bash
codex-session-usage
```

예시:

```text
model gpt-5.5 | plan plus | 5h 38% used (62% left, resets Apr 25, 12:02 PM) | 7d 6% used (94% left, resets Apr 29, 10:31 AM)
```

## 제거

전역 설치를 제거하려면:

```bash
npm uninstall -g codex-session-usage
```

Codex 하단 표시 설정까지 제거하려면 `~/.codex/config.toml`에서 `[tui] status_line` 항목을 직접 삭제하거나 원하는 항목으로 수정합니다.
