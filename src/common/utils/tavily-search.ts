interface ErrorData {
  detail: {
    error: string;
  };
}

interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content: string | null;
  favicon: string;
}

interface AutoParameters {
  topic: string;
  search_depth: string;
}

interface Usage {
  credits: number;
}

interface ImageType {
  url: string;
  description: string;
}

interface SearchResponse {
  query: string;
  answer: string;
  // images 배열이 비어있어 구체적인 타입을 추론할 수 없으므로 any[]로 지정했습니다.
  // 실제 데이터 구조에 따라 string[] 또는 별도의 Image 인터페이스 배열로 변경할 수 있습니다.
  images: ImageType[];
  results: SearchResult[];
  response_time: string;
  auto_parameters: AutoParameters;
  usage: Usage;
  request_id: string;
}

export const tavilySearch = async (
  query: string,
  signal?: AbortSignal
): Promise<SearchResponse> => {
  const requestUrl = new URL("https://api.tavily.com/search");

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    signal,
    body: JSON.stringify({
      query,
    }),
  });

  if (!response.ok) {
    const errorData: ErrorData = (await response.json()) as ErrorData;
    throw new Error(errorData.detail.error);
  }

  const searchResponse = (await response.json()) as SearchResponse;

  return searchResponse;
};
