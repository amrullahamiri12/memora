function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginatedResponse(items, total, { page, limit }) {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

module.exports = { parsePagination, paginatedResponse };
