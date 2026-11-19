/** Lấy token phiên từ header `Authorization: Bearer <token>`; không có thì trả chuỗi rỗng. */
export const bearer = (header?: string): string => /^Bearer (\S+)$/.exec(header ?? '')?.[1] ?? '';
