// Announcement 모델이 v2 스키마에서 제거됨
// 향후 공지사항 시스템 재구축 시 사용할 스텁

export async function listAnnouncements() {
  return [];
}

export async function createAnnouncement(_data: {
  title: string;
  content: string;
  important?: boolean;
  authorId: number;
}) {
  return { id: 0, title: _data.title, content: _data.content, important: _data.important || false };
}

export async function updateAnnouncement(_id: number, _data: {
  title?: string;
  content?: string;
  important?: boolean;
}) {
  return null;
}

export async function deleteAnnouncement(_id: number) {
  // no-op
}
