const SPECIAL_QUERIES = {
  // 1. Giới thiệu về chatbot
  ABOUT_BOT: {
    patterns: [
      /chatbot này là gì/i,
      /bot này là gì/i,
      /đây là chatbot gì/i,
      /giới thiệu về chatbot/i,
      /bạn là (gì|ai)/i,
      /cho mình hỏi về chatbot/i
    ],
    response: "🤖 Xin chào! Tôi là chatbot RAG (Retrieval-Augmented Generation) được phát triển dành riêng cho Trường Đại học Vinh.\n\n📚 Tôi giúp bạn tìm kiếm thông tin về quy chế, quy định, thông báo và các tài liệu quan trọng của trường.\n\n🔍 Hãy đặt câu hỏi, tôi sẽ cố gắng cung cấp câu trả lời chính xác nhất!"
  },

  // 2. Thông tin về người phát triển chatbot
  ABOUT_CREATOR: {
    patterns: [
      /ai (tạo|phát triển|làm|viết) ra bạn/i,
      /ai là người (tạo|phát triển|làm|viết)/i,
      /chatbot này do ai/i,
      /người (tạo|phát triển|làm|viết)/i
    ],
    response: "👨‍💻 Chatbot này được nghiên cứu và phát triển bởi Đặng Ngọc Anh (Penguin🐧) cùng nhóm Công nghệ Thông tin của Trường Đại học Vinh.\n\n🦆 Penguin luôn sẵn sàng cải tiến chatbot để hỗ trợ bạn tốt hơn!\n\n📞 Nếu bạn muốn biết thêm thông tin hoặc đóng góp ý kiến, vui lòng liên hệ với Phòng Công nghệ Thông tin của trường."
  },

  // 3. Hướng dẫn xử lý khi gặp lỗi
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
    response: "⚠️ Nếu bạn gặp sự cố khi sử dụng chatbot, vui lòng liên hệ với bộ phận hỗ trợ theo các cách sau:\n\n📧 Email: support@vinhuni.edu.vn\n📞 Hotline: [Số hotline hỗ trợ]\n🏢 Trực tiếp tại Phòng Công nghệ Thông tin - Tầng X, Tòa nhà Y, Trường Đại học Vinh."
  },

  // 4. Hướng dẫn sử dụng chatbot
  USAGE_GUIDE: {
    patterns: [
      /hướng dẫn sử dụng/i,
      /sử dụng như thế nào/i,
      /cách sử dụng/i,
      /dùng như thế nào/i,
      /dùng sao/i
    ],
    response: "📒 Hướng dẫn sử dụng chatbot:\n\n1️⃣ Nhập câu hỏi của bạn một cách rõ ràng và cụ thể.\n2️⃣ Chọn tập tài liệu liên quan trong thanh điều hướng bên trái (nếu có).\n3️⃣ Điều chỉnh các tùy chọn nâng cao để có kết quả chính xác hơn.\n4️⃣ Đọc kỹ các trích dẫn từ tài liệu đi kèm để kiểm chứng thông tin.\n\n🛠️ Nếu cần thêm hỗ trợ, hãy liên hệ với đội ngũ kỹ thuật của chúng tôi!"
  },

  // 5. Lời chào / bắt đầu cuộc trò chuyện
  GREETING: {
    patterns: [
      /xin chào/i,
      /chào bạn/i,
      /hello/i,
      /hi bot/i,
      /bắt đầu/i,
      /start/i
    ],
    response: "👋 Xin chào bạn! Tôi là trợ lý ảo của Trường Đại học Vinh. Bạn muốn tôi giúp gì hôm nay? 📚"
  },

  // 6. Khi người dùng không biết hỏi gì / cần gợi ý
  SUGGESTIONS: {
    patterns: [
      /không biết hỏi gì/i,
      /hỏi gì được/i,
      /bạn giúp được gì/i,
      /gợi ý câu hỏi/i,
      /tư vấn giúp/i
    ],
    response: "🤖 Tôi có thể giúp bạn tra cứu thông tin về:\n- 📘 Quy chế đào tạo, học phí, điểm thi\n- 🏫 Thông tin phòng ban, giảng viên\n- 🗓️ Lịch học, lịch thi\n\nBạn có thể hỏi ví dụ như:\n• *“Làm lại môn có tốn học phí không?”*\n• *“Liên hệ phòng đào tạo thế nào?”*\n• *“Cách tính điểm học phần là gì?”*"
  },

  // 7. Cảm ơn / Phản hồi tích cực
  THANKS_OR_FEEDBACK: {
    patterns: [
      /cảm ơn/i,
      /thanks/i,
      /tốt quá/i,
      /hay ghê/i,
      /giỏi quá/i,
      /yêu bot/i
    ],
    response: "🥰 Cảm ơn bạn nhiều lắm! Mình sẽ tiếp tục cố gắng để hỗ trợ bạn tốt hơn mỗi ngày. Nếu còn gì cần, cứ hỏi nhé!"
  }
};

// Hàm kiểm tra truy vấn đặc biệt
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

export default SPECIAL_QUERIES;
