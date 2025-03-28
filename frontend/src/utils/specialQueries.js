const SPECIAL_QUERIES = {
  // Giới thiệu về chatbot
  ABOUT_BOT: {
    patterns: [
      /chatbot này là gì/i,
      /bot này là gì/i,
      /đây là chatbot gì/i,
      /giới thiệu về chatbot/i,
      /bạn là (gì|ai)/i,
      /cho mình hỏi về chatbot/i
    ],
    response: "\ud83e\udd16 Xin chào! Tôi là chatbot RAG (Retrieval-Augmented Generation) được phát triển dành riêng cho Trường Đại học Vinh. \n\n\ud83d\udcda Tôi giúp bạn tìm kiếm thông tin về quy chế, quy định, thông báo và các tài liệu quan trọng của trường.\n\n\ud83d\udd0d Hãy đặt câu hỏi, tôi sẽ cố gắng cung cấp câu trả lời chính xác nhất!"
  },

  // Thông tin về người phát triển chatbot
  ABOUT_CREATOR: {
    patterns: [
      /ai (tạo|phát triển|làm|viết) ra bạn/i,
      /ai là người (tạo|phát triển|làm|viết)/i,
      /chatbot này do ai/i,
      /người (tạo|phát triển|làm|viết)/i
    ],
    response: "\ud83d\udc68\u200d\ud83d\udcbb Chatbot này được nghiên cứu và phát triển bởi Đặng Ngọc Anh (Penguin🐧) cùng nhóm Công nghệ Thông tin của Trường Đại học Vinh. \n\n\ud83e\udd86 Penguin luôn sẵn sàng cải tiến chatbot để hỗ trợ bạn tốt hơn!\n\n\ud83d\udcde Nếu bạn muốn biết thêm thông tin hoặc đóng góp ý kiến, vui lòng liên hệ với Phòng Công nghệ Thông tin của trường."
  },

  // Hướng dẫn xử lý khi gặp lỗi
  ERROR_SUPPORT: {
    patterns: [
      /gặp lỗi/i,
      /không hoạt động/i,
      /bị lỗi/i,
      /lỗi liên hệ/i,
      /liên hệ ở đâu/i,
      /liên hệ với ai/i,
      /hỗ trợ ở đâu/i
    ],
    response: "\u26a0\ufe0f Nếu bạn gặp sự cố khi sử dụng chatbot, vui lòng liên hệ với bộ phận hỗ trợ theo các cách sau:\n\n\ud83d\udce7 Email: support@vinhuni.edu.vn\n\ud83d\udcde Hotline: [Số hotline hỗ trợ]\n\ud83c\udfe2 Trực tiếp tại Phòng Công nghệ Thông tin - Tầng X, Tòa nhà Y, Trường Đại học Vinh."
  },

  // Hướng dẫn cách sử dụng chatbot
  USAGE_GUIDE: {
    patterns: [
      /hướng dẫn sử dụng/i,
      /sử dụng như thế nào/i,
      /cách sử dụng/i,
      /dùng như thế nào/i,
      /dùng sao/i
    ],
    response: "\ud83d\udcd2 Hướng dẫn sử dụng chatbot:\n\n1️⃣ Nhập câu hỏi của bạn một cách rõ ràng và cụ thể.\n2️⃣ Chọn tập tài liệu liên quan trong thanh điều hướng bên trái (nếu có).\n3️⃣ Điều chỉnh các tùy chọn nâng cao để có kết quả chính xác hơn.\n4️⃣ Đọc kỹ các trích dẫn từ tài liệu đi kèm để kiểm chứng thông tin.\n\n\ud83d\udee0\ufe0f Nếu cần thêm hỗ trợ, hãy liên hệ với đội ngũ kỹ thuật của chúng tôi!"
  }
};

export const checkSpecialQuery = (query) => {
  for (const [type, data] of Object.entries(SPECIAL_QUERIES)) {
    for (const pattern of data.patterns) {
      if (pattern.test(query)) {
        return {
          isSpecial: true,
          response: data.response
        };
      }
    }
  }
  return {
    isSpecial: false,
    response: null
  };
};
