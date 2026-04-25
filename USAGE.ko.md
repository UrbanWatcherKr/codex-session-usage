# codex-session-usage 사용법

`codex-session-usage`는 현재 Codex 로그인 세션을 기준으로 계정 플랜과 공식 사용률을 읽고, Codex TUI 하단 status line 설정을 설치하는 작은 CLI 모듈이다.

수동으로 계정 정보, 플랜, 한도 값을 입력하지 않는다. 내부적으로 `codex app-server`의 `account/read`, `account/rateLimits/read`를 호출해서 Codex에 이미 로그인된 계정 정보를 사용한다.

## 현재 확정된 하단 표시 방식

Codex TUI 하단은 Codex가 제공하는 내장 항목으로 표시한다.

```text
gpt-5.5 high · ~/project · 5h 27% · weekly 88% · Context 21% used …
```

설치 명령은 `~/.codex/config.toml`에 아래 설정을 넣는다.

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

Codex를 재시작하면 이 설정이 반영된다.

## 로컬에서 실행

아직 GitHub에 배포하지 않은 상태에서는 패키지 폴더에서 직접 실행한다.

```bash
cd <repo-dir>
node bin/codex-session-usage.mjs
```

설치 동작을 미리 확인하려면:

```bash
node bin/codex-session-usage.mjs install --dry-run
```

실제로 Codex TUI status line 설정을 쓰려면:

```bash
node bin/codex-session-usage.mjs install
```

## 개발 중 전역 명령으로 쓰기

GitHub에 올리기 전에도 로컬에서 전역 명령처럼 쓸 수 있다.

```bash
cd <repo-dir>
npm link
```

그 다음 어느 디렉터리에서든 실행할 수 있다.

```bash
codex-session-usage
codex-session-usage install
```

로컬 링크를 제거하려면:

```bash
npm unlink -g codex-session-usage
```

## GitHub 배포 방식

권장 방식은 이 패키지 내용을 별도 GitHub 저장소의 루트로 올리는 것이다.

중요: `package.json`이 GitHub 저장소 루트에 있어야 한다. 다른 프로젝트의 하위 폴더에 넣은 상태로 올리면 `npm install -g github:<github-user>/codex-session-usage`가 바로 동작하지 않는다.

권장 구조:

```text
codex-session-usage/
  package.json
  bin/
  src/
  test/
  README.md
  USAGE.ko.md
```

GitHub에 올릴 파일:

```text
.gitignore
README.md
USAGE.ko.md
package.json
bin/codex-session-usage.mjs
src/*.mjs
test/*.mjs
```

GitHub에 올리지 말아야 할 파일:

```text
node_modules/
.env
.env.*
coverage/
~/.codex/
~/.codex-session-usage/
snapshots.jsonl
```

배포 절차 예시:

```bash
cd <repo-dir>
git init
git add .
git commit -m "Initial codex session usage module"
git branch -M main
git remote add origin git@github.com:<github-user>/codex-session-usage.git
git push -u origin main
```

GitHub CLI를 쓰는 경우:

```bash
cd <repo-dir>
gh repo create codex-session-usage --private --source=. --remote=origin --push
```

공개 배포를 원하면 `--private` 대신 `--public`을 쓴다.

## GitHub에서 설치

전역 명령으로 계속 쓰려면:

```bash
npm install -g github:<github-user>/codex-session-usage
```

설치 후:

```bash
codex-session-usage
codex-session-usage install
```

`install`을 실행한 뒤 Codex를 재시작하면 하단 status line 설정이 반영된다.

일회성으로 설치 명령만 실행하려면:

```bash
npx github:<github-user>/codex-session-usage install
```

`npx`는 일회성 실행이다. 이후에도 `codex-session-usage` 명령을 계속 쓰려면 `npm install -g github:...`로 전역 설치해야 한다.

## 명령어

기본 상태 출력:

```bash
codex-session-usage
```

상세 출력:

```bash
codex-session-usage --verbose
```

JSON 출력:

```bash
codex-session-usage --json
```

최근 스냅샷 포함 JSON:

```bash
codex-session-usage --history --json
```

Codex TUI 하단 설정 설치:

```bash
codex-session-usage install
```

## 저장되는 파일

실행할 때마다 스냅샷이 아래 파일에 기록된다.

```text
~/.codex-session-usage/snapshots.jsonl
```

스냅샷에는 플랜, 세션 ID, 모델, 사용률, reset 시간이 들어간다. 계정 이메일이나 토큰 원문은 저장하지 않는다.

## 주의 사항

- 외부 GitHub 저장소 코드를 실행하지 않는다. 이 모듈은 Codex 로컬 로그인 상태와 로컬 Codex DB만 읽는다.
- `sqlite3` 명령이 필요하다.
- Codex에 로그인되어 있어야 공식 플랜과 rate limit 값을 읽을 수 있다.
- Codex TUI 하단은 Codex 내장 status-line 항목을 사용한다. 임의의 두 줄 문자열이나 커스텀 명령 출력을 하단에 직접 삽입하는 구조가 아니다.
