export const courseData = [
  {
    'CS410': {
      id: 'CS410',
      title: 'Học máy',
      description: 'Giới thiệu về học máy và các ứng dụng',
      instructor: 'GV. Nguyễn Văn A',
      schedule: 'Thứ 2, 4 - Tiết 1-3',
      progress: '8/15 buổi',
      announcements: [
        {
          title: 'Thông báo về bài tập lớn',
          content: 'Sinh viên nộp bài tập lớn trước 23:55 ngày 15/5/2024',
          date: '2024-04-20'
        }
      ],
      chapters: [
        {
          id: 1,
          title: 'Tổng quan về học máy',
          description: 'Giới thiệu chung về học máy và các khái niệm cơ bản',
          materials: [
            {
              id: 'lect1',
              title: 'Bài giảng 1: Tổng quan',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 1 -overview.html'
            }
          ]
        },
        {
          id: 2,
          title: 'Hồi quy tuyến tính',
          description: 'Phương pháp hồi quy tuyến tính và ứng dụng',
          materials: [
            {
              id: 'lect2',
              title: 'Bài giảng 2: Hồi quy tuyến tính',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 2 -linear-regression.html'
            }
          ]
        },
        {
          id: 3,
          title: 'Hàm phân biệt tuyến tính',
          description: 'Các phương pháp phân loại sử dụng hàm phân biệt tuyến tính',
          materials: [
            {
              id: 'lect3',
              title: 'Bài giảng 3: Hàm phân biệt tuyến tính',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect.3-linear-discriminant-function.html'
            }
          ]
        },
        {
          id: 4,
          title: 'Máy vector hỗ trợ (SVM)',
          description: 'Support Vector Machine và ứng dụng trong phân loại',
          materials: [
            {
              id: 'lect4',
              title: 'Bài giảng 4: Support Vector Machine',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect.4-support-vector-machine.html'
            }
          ]
        },
        {
          id: 5,
          title: 'Mô hình phi tham số',
          description: 'Các phương pháp học máy phi tham số',
          materials: [
            {
              id: 'lect5',
              title: 'Bài giảng 5: Mô hình phi tham số',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 5 -nonparametric-models.pdf'
            }
          ]
        },
        {
          id: 6,
          title: 'Mạng nơ-ron',
          description: 'Mạng nơ-ron nhân tạo và học sâu',
          materials: [
            {
              id: 'lect6',
              title: 'Bài giảng 6: Mạng nơ-ron',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 6 -neural-network.pdf'
            },
            {
              id: 'lect7',
              title: 'Bài giảng 7: Lập trình mạng nơ-ron với Python',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 7 -neural-network-by-python.pdf'
            }
          ]
        },
        {
          id: 7,
          title: 'Mạng nơ-ron tích chập (CNN)',
          description: 'Mạng nơ-ron tích chập và ứng dụng trong xử lý ảnh',
          materials: [
            {
              id: 'lect8',
              title: 'Bài giảng 8: Mạng nơ-ron tích chập cơ bản',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 8 -convolutional-neural-network.pdf'
            },
            {
              id: 'lect9',
              title: 'Bài giảng 9: Kiến trúc CNN hiện đại',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 9 -modern-CNNs.pdf'
            }
          ]
        }
      ],
      exercises: [
        {
          id: 1,
          title: 'Bài tập thực nghiệm số 1',
          description: 'Lấy và chuẩn bị tập dữ liệu cho bài toán phân loại',
          dueDate: '2024-05-01T23:55:00',
          type: 'assignment'
        },
        {
          id: 2,
          title: 'Bài tập thực nghiệm số 2',
          description: 'Xây dựng mô hình phân loại sử dụng KNN và Naive Bayes',
          dueDate: '2024-05-15T23:55:00',
          type: 'assignment'
        },
        {
          id: 3,
          title: 'Project 1 - Ứng dụng KNN và Decision Trees',
          description: 'Xây dựng ứng dụng dự đoán bệnh tiểu đường sử dụng KNN và Decision Trees',
          dueDate: '2024-05-30T23:55:00',
          type: 'project'
        }
      ],
      discussions: [
        {
          id: 1,
          title: 'Thảo luận về bài tập số 1',
          description: 'Diễn đàn thảo luận cho bài tập thực nghiệm số 1',
          posts: []
        },
        {
          id: 2,
          title: 'Thảo luận về Project 1',
          description: 'Diễn đàn thảo luận cho Project 1',
          posts: []
        }
      ]
    }
  },
  {
    'CS420': {
      id: 'CS420',
      title: 'Xử lý ảnh',
      description: 'Giới thiệu về xử lý ảnh và các ứng dụng',
      instructor: 'GV. Nguyễn Văn A',
      schedule: 'Thứ 2, 4 - Tiết 1-3',
      progress: '8/15 buổi',
      announcements: [
        {
          title: 'Thông báo về bài tập lớn',
          content: 'Sinh viên nộp bài tập lớn trước 23:55 ngày 15/5/2024',
          date: '2024-04-20'
        }
      ],
      chapters: [
        {
          id: 1,
          title: 'Tổng quan về xử lý ảnh',
          description: 'Giới thiệu chung về xử lý ảnh và các khái niệm cơ bản',
          materials: [
            {
              id: 'lect1',
              title: 'Bài giảng 1: Tổng quan',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 1 -overview.html'
            }
          ]
        },
        {
          id: 2,
          title: 'Hồi quy tuyến tính',
          description: 'Phương pháp hồi quy tuyến tính và ứng dụng',
          materials: [
            {
              id: 'lect2',
              title: 'Bài giảng 2: Hồi quy tuyến tính',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 2 -linear-regression.html'
            }
          ]
        },
        {
          id: 3,
          title: 'Hàm phân biệt tuyến tính',
          description: 'Các phương pháp phân loại sử dụng hàm phân biệt tuyến tính',
          materials: [
            {
              id: 'lect3',
              title: 'Bài giảng 3: Hàm phân biệt tuyến tính',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect.3-linear-discriminant-function.html'
            }
          ]
        },
        {
          id: 4,
          title: 'Máy vector hỗ trợ (SVM)',
          description: 'Support Vector Machine và ứng dụng trong phân loại',
          materials: [
            {
              id: 'lect4',
              title: 'Bài giảng 4: Support Vector Machine',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect.4-support-vector-machine.html'
            }
          ]
        },
        {
          id: 5,
          title: 'Mô hình phi tham số',
          description: 'Các phương pháp học máy phi tham số',
          materials: [
            {
              id: 'lect5',
              title: 'Bài giảng 5: Mô hình phi tham số',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 5 -nonparametric-models.pdf'
            }
          ]
        },
        {
          id: 6,
          title: 'Mạng nơ-ron',
          description: 'Mạng nơ-ron nhân tạo và học sâu',
          materials: [
            {
              id: 'lect6',
              title: 'Bài giảng 6: Mạng nơ-ron',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 6 -neural-network.pdf'
            },
            {
              id: 'lect7',
              title: 'Bài giảng 7: Lập trình mạng nơ-ron với Python',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 7 -neural-network-by-python.pdf'
            }
          ]
        },
        {
          id: 7,
          title: 'Mạng nơ-ron tích chập (CNN)',
          description: 'Mạng nơ-ron tích chập và ứng dụng trong xử lý ảnh',
          materials: [
            {
              id: 'lect8',
              title: 'Bài giảng 8: Mạng nơ-ron tích chập cơ bản',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 8 -convolutional-neural-network.pdf'
            },
            {
              id: 'lect9',
              title: 'Bài giảng 9: Kiến trúc CNN hiện đại',
              type: 'pdf',
              url: '/CourseDemo/MachineLearning/lect. 9 -modern-CNNs.pdf'
            }
          ]
        }
      ],
      exercises: [
        {
          id: 1,
          title: 'Bài tập thực nghiệm số 1',
          description: 'Lấy và chuẩn bị tập dữ liệu cho bài toán phân loại',
          dueDate: '2024-05-01T23:55:00',
          type: 'assignment'
        },
        {
          id: 2,
          title: 'Bài tập thực nghiệm số 2',
          description: 'Xây dựng mô hình phân loại sử dụng KNN và Naive Bayes',
          dueDate: '2024-05-15T23:55:00',
          type: 'assignment'
        },
        {
          id: 3,
          title: 'Project 1 - Ứng dụng KNN và Decision Trees',
          description: 'Xây dựng ứng dụng dự đoán bệnh tiểu đường sử dụng KNN và Decision Trees',
          dueDate: '2024-05-30T23:55:00',
          type: 'project'
        }
      ],
      discussions: [
        {
          id: 1,
          title: 'Thảo luận về bài tập số 1',
          description: 'Diễn đàn thảo luận cho bài tập thực nghiệm số 1',
          posts: []
        },
        {
          id: 2,
          title: 'Thảo luận về Project 1',
          description: 'Diễn đàn thảo luận cho Project 1',
          posts: []
        }
      ]
    }
  }
]