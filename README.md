# Personal Archive · 개인 브랜딩 사이트

독립적인 Next.js + TypeScript App Router 프로젝트. C안 하이브리드: 에디토리얼 자기소개 + 작업/기록 카드. 반응형, 키보드 포커스, 본문 바로가기, 한국어 문서 언어, 모션 감소 지원. 정적 내보내기로 운영할 수 있습니다.

## 실행

Node.js 20.9 이상을 설치한 다음 이 폴더에서 실행합니다.

```powershell
npm ci
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다. `npm run typecheck`, `npm test`, `npm run build`로 검증합니다. 빌드된 정적 사이트는 `out/`에 생성됩니다. `output: export`이므로 `next start` 대신 정적 호스팅을 사용하세요.

## 내용과 출처

전공에서 이미 통신·네트워크를 배웠고 2026년에 심화 실습했다는 사용자 설명을 반영했습니다. 실제 리추얼 파일과 이전 ZIP을 확보하지 못한 초기 상태입니다. 실제 경험이나 성과·심리 점수를 만들지 않았습니다. 3가지 역량은 근거 연결 대기이며 논문은 자료 등록 대기, 앱은 예정입니다. 다운로드 문서는 준비 문서/초안으로 표시합니다. 원본이 확보되면 명시적인 아래 스키마로 수동 변환하고 출처를 적으세요. 변환 과정에서 의미를 임의로 추론하지 마세요.

## 승인 기반 갱신

```json
{"schemaVersion":1,"records":[{"id":"고유-id","date":"2026-10-13","title":"제목","summary":"공개할 실제 기록 요약","category":"자기조절력","source":"원본 파일명 / 원본 항목 ID"}]}
```

category는 자기조절력, 대인관계력, 자기동기력 중 하나입니다. 입력은 **전체 교체** 목록입니다. 공개할 항목만 포함하세요. 개인 연락처, 타인의 정보, 비공개 내용은 제거한 뒤 검토하세요. 원본은 저장소 밖에 보관합니다. 이 도구는 LLM을 호출하거나 자동 문장을 생성하지 않습니다. 같은 입력과 기준 파일은 같은 제안 ID와 정렬 결과를 만듭니다. 승인 시간은 감사용 메타데이터입니다.

1. `npm run records:propose -- "C:\path\public-records.json"`
2. 출력된 `updates/<제안ID>.review.md`에서 추가·변경·삭제와 전체 공개 본문을 검토합니다.
3. `npm run records:approve -- "updates/<제안ID>.json" --reviewer "본인 이름" --confirm-public`
4. `npm run records:apply -- "updates/<제안ID>.json"`
5. `npm test`와 `npm run build`를 실행하고 GitHub Desktop의 변경 내역에서 사이트 데이터와 다운로드 JSON을 확인하여 커밋합니다.

승인은 정확한 제안 해시에 연결됩니다. 승인 뒤 제안 또는 기준 데이터가 변경되면 다시 제안/승인해야 합니다. 승인 없는 반영은 거부됩니다. `updates/`에는 백업과 승인·반영 감사 기록이 남으며 Git에서 제외됩니다. 되돌리기는 GitHub Desktop의 Revert 또는 백업 데이터를 새 제안으로 승인해 반영하세요. 이 장치는 로컬 소유자 검토 절차이며 암호학적인 사용자 인증 시스템이 아닙니다. 로컬 파일을 직접 수정할 권한이 있는 사람까지 막는 장치는 아닙니다.

기록 건수, 고유 날짜 수, 고유 분류 수만 계산합니다. 빈 원본 상태는 미연결(—)로 표시합니다. 결측 날짜를 실패로 계산하지 않습니다. 요약문·역량 소개·문서 내용은 기록 갱신 시 자동 변경되지 않으므로 실제 근거 확인 뒤 별도 검토해 수정하세요.

## GitHub Desktop

이 폴더에는 독립적인 Git 저장소가 초기화되어 있습니다.

1. GitHub Desktop → File → Add Local Repository (Add Existing Repository)에서 이 프로젝트 폴더를 선택합니다.
2. 첫 커밋이 없는 경우 Summary에 `Initial personal archive`를 입력하고 Commit to main을 선택합니다. 커밋 작성자 설정은 본인 GitHub 이름/이메일로 지정하세요.
3. GitHub Desktop에서 본인 GitHub 계정으로 로그인합니다.
4. Publish Repository를 선택하고 저장소 이름과 계정을 확인합니다. 개인 기록이 포함되므로 우선 **Keep this code private**를 유지하는 것을 권장합니다.
5. Publish Repository를 클릭하면 해당 계정에 원격 저장소가 생성되고 연결됩니다.

현재 GitHub 원격 연결과 웹 공개 배포는 수행하지 않았습니다. GitHub 계정 로그인 및 원격 생성은 사용자가 수행해야 합니다. 저장소 Publish는 웹사이트 배포와 별개입니다. 웹 공개는 자료 검토 후 Next.js 정적 `out/`를 지원하는 호스팅에 배포하세요. GitHub Pages의 프로젝트 하위 경로는 별도 basePath 설정이 필요합니다.

## 편집 위치

- `app/page.tsx`: 자기소개, 논문·앱 상태, 문서 목록
- `app/globals.css`: 색상, 반응형 레이아웃
- `data/records.json`: 승인 반영된 공개 데이터
- `public/documents/`: 다운로드 가능한 공개 문서
- `scripts/update.mjs`: 결정론적 검증/갱신 장치

외부 폰트, 추적 도구, 외부 이미지, API 비밀키를 사용하지 않습니다. 기존 projects의 다른 폴더는 수정하지 않습니다.
