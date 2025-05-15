// OCR API 연동 - Azure Computer Vision API 사용
import axios from 'axios';

const API_KEY = process.env.REACT_APP_AZURE_VISION_KEY;
const ENDPOINT = process.env.REACT_APP_AZURE_VISION_ENDPOINT;

// Mock 함수 - 테스트용
export const processReceiptImageMock = async (imageFile) => {
  // 임시 데이터 반환을 위한 mock 함수입니다.
  // 실제 구현은 아래 processReceiptImage 함수를 참고하세요.
  
  // 임시 데이터 반환
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        storeName: '스타벅스 강남점',
        date: '2024-03-15 14:30',
        items: [
          { name: '아메리카노', price: 4500, quantity: 1 },
          { name: '카페라떼', price: 5000, quantity: 1 },
          { name: '크로플', price: 3500, quantity: 2 },
        ],
        totalAmount: 16500,
      });
    }, 2000);
  });
};

// 실제 OCR API 연동 예시
export const processReceiptImage = async (imageFile) => {
  try {
    // 이미지를 Base64로 인코딩
    const reader = new FileReader();
    const base64Image = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(imageFile);
    });

    // Azure Computer Vision API 호출
    const response = await axios.post(
      `${ENDPOINT}/vision/v3.2/read/analyze`,
      {
        url: `data:image/jpeg;base64,${base64Image}`
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': API_KEY
        }
      }
    );

    // 작업 ID 추출
    const operationLocation = response.headers['operation-location'];
    const operationId = operationLocation.split('/').pop();

    // 결과 대기 (최대 10초)
    let result;
    for (let i = 0; i < 10; i++) {
      const statusResponse = await axios.get(
        `${ENDPOINT}/vision/v3.2/read/analyzeResults/${operationId}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': API_KEY
          }
        }
      );

      if (statusResponse.data.status === 'succeeded') {
        result = statusResponse.data;
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!result) {
      throw new Error('OCR 처리 시간 초과');
    }

    // 결과 파싱
    const textLines = result.analyzeResult.readResults[0].lines;
    const receiptData = {
      storeName: '',
      date: '',
      items: [],
      totalAmount: 0
    };

    // 가게명 찾기 (첫 번째 줄)
    if (textLines.length > 0) {
      receiptData.storeName = textLines[0].text;
    }

    // 날짜 찾기 (YYYY-MM-DD 형식)
    const dateRegex = /\d{4}[-년]\d{1,2}[-월]\d{1,2}/;
    for (const line of textLines) {
      const dateMatch = line.text.match(dateRegex);
      if (dateMatch) {
        receiptData.date = dateMatch[0].replace(/[년월]/g, '-');
        break;
      }
    }

    // 금액 찾기
    const amountRegex = /(\d{1,3}(,\d{3})*원|\d{1,3}(,\d{3})*)/g;
    for (const line of textLines) {
      const amounts = line.text.match(amountRegex);
      if (amounts) {
        // 마지막 금액을 총액으로 간주
        const lastAmount = amounts[amounts.length - 1];
        receiptData.totalAmount = parseInt(lastAmount.replace(/[^0-9]/g, ''));
        
        // 이전 금액들을 상품 금액으로 간주
        for (let i = 0; i < amounts.length - 1; i++) {
          const amount = parseInt(amounts[i].replace(/[^0-9]/g, ''));
          if (amount > 0) {
            receiptData.items.push({
              name: `상품 ${i + 1}`,
              price: amount,
              quantity: 1
            });
          }
        }
      }
    }

    return receiptData;
  } catch (error) {
    console.error('OCR 처리 중 오류 발생:', error);
    throw error;
  }
}; 