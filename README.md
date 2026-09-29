# 냉장고 파먹기 MVP — 무료 배포 가이드 (Gemini 버전)

로그인 없이 링크만으로 접속하는 웹사이트 버전입니다. 비용 0원으로 운영합니다.
- AI: Google Gemini API 무료 등급 (카드 등록 불필요)
- 호스팅: Vercel 무료 플랜
- 레시피: 메뉴마다 유튜브·네이버 블로그·만개의레시피 검색 결과로 연결

## 폴더 구성
| 파일 | 역할 |
|---|---|
| `index.html` | 사용자 화면 (재료 입력, 소비기한 자동 정렬, 결과 표시) |
| `api/recommend.js` | 서버 함수. API 키를 숨긴 채 Gemini를 호출 |
| `vercel.json` | 서버 함수 실행 시간 설정 |
| `package.json` | 실행 환경 정보 |

코드는 수정할 필요 없습니다.

---

## 1단계. Gemini API 키 받기 (약 5분)
1. Google AI Studio(https://aistudio.google.com)에 구글 계정으로 로그인합니다.
2. 왼쪽 메뉴에서 `Get API key` (또는 API Keys) → `Create API key`
3. 만들어진 키(`AQ.`로 시작, 예전 방식 키는 `AIza`로 시작)를 복사해 안전한 곳에 저장합니다.
4. 결제(Billing)는 **설정하지 마세요.** 결제를 켜면 무료 등급이 아니라 유료 등급으로 바뀝니다.
5. 같은 화면의 사용량/한도(Rate limit) 메뉴에서 우리 프로젝트의 무료 한도를 확인해 캡처해 두세요. 실행안의 근거 자료가 됩니다.

> ⚠️ API 키는 비밀번호와 같습니다. 단톡방·과제 자료·GitHub에 올리지 말고, 3단계의 Vercel 설정 칸에만 넣으세요.
> ℹ️ AI Studio에서 키 사용 범위를 제한하라는 안내가 나오면, Gemini API(Generative Language API)만 쓰도록 제한하면 됩니다.

## 2단계. GitHub에 파일 올리기 (약 10분)
1. GitHub(https://github.com)에 가입합니다.
2. 오른쪽 위 `+` → `New repository` → 이름 입력(예: `fridge-mvp`) → `Create repository`
3. `uploading an existing file`을 누르고, 이 폴더 안의 파일들과 `api` 폴더를 통째로 끌어다 놓습니다.
4. `index.html`, `api/recommend.js`, `vercel.json`, `package.json`이 모두 보이는지 확인 → `Commit changes`

## 3단계. Vercel로 배포하기 (약 10분)
1. Vercel(https://vercel.com)에 GitHub 계정으로 가입합니다. 플랜은 무료 `Hobby`를 고릅니다.
2. `Add New…` → `Project` → 2단계 저장소 옆 `Import`
3. **Environment Variables**를 펼치고 추가합니다.
   - Key: `GEMINI_API_KEY`
   - Value: 1단계에서 복사한 키
4. `Deploy` → 1분 정도 기다리면 `https://프로젝트이름.vercel.app` 주소가 생깁니다.

## 4단계. 동작 확인
1. 주소에 접속 → `예시 재료 채우기` → `맞춤 메뉴 추천받기`
2. 메뉴 3개와 레시피 검색 버튼이 나오면 성공입니다.
3. 조건을 바꿔 2번 이상 실행하고 캡처하면 'AI 테스트 2건' 증거가 됩니다.

## 문제가 생기면
| 화면 메시지 | 해결 방법 |
|---|---|
| 서버에 API 키가 설정되지 않았어요 | Vercel → Settings → Environment Variables에 키를 넣고, Deployments에서 `Redeploy` |
| API 키 또는 모델 설정을 확인해 주세요 | 키를 잘못 복사했거나 사용이 막힌 키. Vercel → Logs에서 오류 내용 확인 후 새 키로 교체·`Redeploy` |
| 모델 이름을 찾을 수 없어요 | 기본 모델이 바뀌었을 수 있어요. AI Studio에서 무료 등급 모델 이름을 확인해 `GEMINI_MODEL` 환경변수로 추가 후 `Redeploy` |
| 무료 사용 한도에 도달했어요 | 잠시 뒤 다시 시도. 테스트 인원이 많으면 시간을 나눠 진행 |

## 알아둘 점
- 무료 등급 요청 내용은 Google 제품 개선에 사용될 수 있습니다. 테스트 참여자에게 개인정보를 입력하지 않도록 안내하세요. (화면 상단에도 안내 문구가 있어요)
- 무료 등급은 사용 한도가 있어 소규모 사용자 테스트용입니다. 실제 서비스 규모로 키우려면 유료 전환이 필요합니다.
- 조리 순서는 AI가 생성한 요약이므로, 링크된 실제 레시피와 함께 확인하도록 안내합니다.
