# 숫자와 문단 후보 갱신 장치

Node.js 20.9 이상. AI 서비스 키 없이 실행합니다. 같은 입력 내용과 기준 데이터이면 어느 폴더에서도 같은 제안 ID와 결과를 만듭니다. 승인한 결과만 공개합니다.

## 세 단계 실행

1. `inputs/rituals.json`, `attendance.json`, `tasks.json`을 공개 가능한 실제 기록으로 수정하고 `npm run refresh:generate -- inputs`를 실행합니다. 출력된 `updates/refresh/<ID>.review.md`에서 숫자와 후보 전체를 검토합니다.
2. `npm run refresh:approve -- "updates/refresh/<ID>.json" --candidates "후보ID1,후보ID2" --confirm-public`를 실행합니다. 문단을 모두 제외하려면 `--candidates none`을 사용합니다. 숫자와 장면 기록도 함께 공개 승인하는 단계입니다.
3. `npm run refresh:apply -- "updates/refresh/<ID>.json"`을 실행한 다음 `npm test`로 확인합니다. ZIP만 실행하는 경우 여기까지이며, 전체 사이트 프로젝트에서 `npm run build`로 빌드합니다. GitHub Desktop에서 변경을 검토·커밋하고 기존 호스팅에 다시 배포합니다.

원본을 이 폴더에 통째로 넣지 마세요. 공개용으로 정리한 근거만 사용하세요. 개인정보와 타인의 이름은 승인 전에 직접 점검해야 합니다. 문단은 입력한 상황·행동·결과를 고정 규칙으로 이어 붙입니다. 원문을 임의로 추론하거나 AI 호출로 생성하지 않습니다.

## 입력 형식

`rituals.json`: schemaVersion 1, source, dates(실제 기록일 배열), records. 각 record에는 id, date, title, summary, category(자기조절력/대인관계력/자기동기력), source, situation, action, result를 적습니다. date는 장면을 남긴 기록일입니다. 과거 사건 연도는 situation에 별도 표기합니다.

`attendance.json`: schemaVersion 1, available, source, records. 각 항목은 id, date, status(present/absent), source. 날짜당 한 항목입니다. 출석 기준과 기간을 source에 명시하세요.

`tasks.json`: schemaVersion 1, available, source, records. 각 과제는 고유 id, date, status(submitted/pending), source. 날짜는 확인 기준일 또는 실제 제출일입니다. 같은 과제의 이력을 여러 행으로 넣지 말고 최신 상태 한 행만 넣습니다.

미확보 자료는 available:false, records:[]로 유지합니다. 해당 숫자는 null(사이트에서 —)이며 0으로 추정하지 않습니다. 리추얼 날짜가 같은 주에 여러 개면 월요일 시작 주 하나로 계산합니다. 누락을 실패로 간주하지 않습니다. 실제 기간은 확보된 처음·마지막 기록일이며 13주 전체 과정 증명과 구분합니다.

## 결과와 승인

- `updates/refresh/`: 후보 JSON, 검토 문서, 승인 파일, 이전 결과 백업. Git 제외.
- `data/generated.json`: 승인 후 사이트 숫자와 선택 문단. 승인되지 않은 후보는 포함하지 않습니다.
- `data/records.json`: 공개 장면 기록.
- `public/documents/latest-result.json`: 다운로드 가능한 마지막 반영 결과.
- `public/documents/refresh-kit.zip`: 소스, 이 README, 입력 예시 및 마지막 결과.

기준 데이터가 변경되거나 제안 내용을 바꾸면 다시 생성·승인해야 합니다. 로컬 소유자가 검토하는 절차이며 사용자 인증 장치는 아닙니다. 직접 파일을 편집할 권한을 막지 않습니다. 파일 여러 개의 갱신은 단일 트랜잭션이 아니므로 실행 중 강제로 종료하지 마세요. 중단 시 백업과 Git 변경 내역으로 상태를 확인하세요.

숫자/승인 문단과 전체 자기소개·이력서는 구분됩니다. 자동 후보는 사이트의 ‘새 기록이 이어가는 이야기’에 들어가며, 자기소개서 본문은 사실 확인 후 직접 편집합니다. 현재 출석/제출은 미확보이며 초기 결과의 후보 승인 문단은 0개입니다.

## 재현 검증

`npm test`는 서로 다른 임시 폴더에서 동일 입력으로 제안을 만들고 ID/본문 일치를 확인합니다. 또한 같은 폴더 반복 실행, 미승인 거부, 제안 변조 거부, 선택하지 않은 후보의 공개 제외를 확인합니다. 사이트 문구와 기록의 사실 여부는 실제 원본 대조가 필요합니다.
