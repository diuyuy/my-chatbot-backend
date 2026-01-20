---
name: integration-test-writer
description: This is the guideline to follow when writing integration tests. Refer to this content when writing integration tests.
---

# integration-test-writer

## Instructions

1. `tests\setup.ts`을 참고해서 setup에서 한 작업을 중복해서 처리하지 말아주세요.
2. 파일 이름은 `{name}.integration.test.ts`로 작성해주세요.
3. `beforeEach()`에 다음과 같이 사용자 데이터를 insert 하고, 필요 시 다른 데이터도 insert 해주세요.

```ts
let testUserId: number;
let testApiKey: string;
let anotherUserId: number;
let anotherApiKey: string;

beforeEach(async () => {
  // Create test users
  const [user1] = await db
    .insert(users)
    .values({ apiKey: "test-api-key-1" })
    .returning();
  testUserId = user1.id;
  testApiKey = user1.apiKey;

  const [user2] = await db
    .insert(users)
    .values({ apiKey: "test-api-key-2" })
    .returning();
  anotherUserId = user2.id;
  anotherApiKey = user2.apiKey;

  /*....*/
});
```

3. `describe()`를 사용하여 각 테스트를 논리적으로 그룹화 해주세요.
4. `it()`에서 테스트에 대한 설명은 모두 영어로 작성해주세요.
5. 인증은 Bearer token을 사용해서 인증해야 합니다:

```ts
 headers: {
    Authorization: `Bearer ${testApiKey}`,
},
```

6. Response Body는 any로 타입 캐스팅 해주세요: `const body = (await res.json()) as any;`
