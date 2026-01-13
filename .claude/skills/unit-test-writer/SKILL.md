---
name: unit-test-writer
description: This is the guideline to follow when writing unit tests. Refer to this content when writing unit tests.
---

# Unit Test Writer

## Instructions
1. export 된 각 함수들에 대한 유닛 테스트 코드를 `{service}.test.ts` 파일에 작성해주세요.
2. `describe()`를 사용하여 각 테스트를 논리적으로 그룹화 해주세요.
3. 각 함수마다 성공 케이스, 실패 케이스, 그리고 엣지 케이스들을 검증해주세요.
4. `it()`에서 테스트에 대한 설명은 모두 영어로 작성해주세요.
5. drizzle-orm의 `db` 인스턴스 모킹 필요 시 다음과 같이 mocking 해주세요.

```ts
vi.mock("../../common/db/db", () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
  },
}));

// Examples
const mockReturning = vi.fn().mockResolvedValue([mockConversation]);
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
(db.insert as any).mockReturnValue({ values: mockValues });
const conversationId = await createConversation(userId, message);
expect(db.insert).toHaveBeenCalled();
/*Other test codes...*/
```
각 테스트 전후로 mock을 초기화해주세요.

6. `CommonHttpException`을 테스트하는 경우 다음과 같이 테스트해주세요:

```ts
try {
  await createConversation(userId, message);
} catch (error) {
  expect(error).toBeInstanceOf(CommonHttpException);
  expect((error as CommonHttpException).code).toBe(RESPONSE_STATUS.INTERNAL_SERVER_ERROR.code);
  expect((error as CommonHttpException).status).toBe(RESPONSE_STATUS.INTERNAL_SERVER_ERROR.status);
}
```
