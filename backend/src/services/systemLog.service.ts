// SystemLog 모델이 v2 스키마에서 제거됨
// 향후 로깅 시스템 재구축 시 사용할 스텁

export async function listLogs(_limit = 100, _offset = 0) {
  return { logs: [], total: 0 };
}

export async function createLog(_data: {
  userId?: number;
  userName?: string;
  action: string;
  target?: string;
  detail?: string;
}) {
  // no-op
}
