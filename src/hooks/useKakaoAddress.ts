import { useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: KakaoAddressData) => void;
        onclose?: () => void;
        width?: string;
        height?: string;
      }) => {
        open: () => void;
        embed: (element: HTMLElement) => void;
      };
    };
  }
}

export interface KakaoAddressData {
  address: string; // 기본 주소
  addressType: string; // 주소 타입 (R: 도로명, J: 지번)
  bname: string; // 법정동/법정리 이름
  buildingName: string; // 건물명
  roadAddress: string; // 도로명 주소
  jibunAddress: string; // 지번 주소
  zonecode: string; // 우편번호
  sido: string; // 시도
  sigungu: string; // 시군구
  sigunguCode: string; // 시군구 코드
  roadname: string; // 도로명
  apartment: string; // 아파트 여부 (Y/N)
}

const KAKAO_POSTCODE_SCRIPT_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

export function useKakaoAddress() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    // 이미 스크립트가 로드되어 있는지 확인
    if (window.daum && window.daum.Postcode) {
      setIsScriptLoaded(true);
      return;
    }

    // 이미 스크립트 태그가 있는지 확인
    const existingScript = document.querySelector(`script[src="${KAKAO_POSTCODE_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsScriptLoaded(true));
      return;
    }

    // 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = KAKAO_POSTCODE_SCRIPT_URL;
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      // cleanup은 하지 않음 (다른 곳에서 사용할 수 있으므로)
    };
  }, []);

  const openAddressSearch = useCallback((onComplete: (address: string, data: KakaoAddressData) => void) => {
    if (!isScriptLoaded || !window.daum) {
      console.error('카카오 주소 검색 스크립트가 로드되지 않았습니다.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data: KakaoAddressData) => {
        // 도로명 주소 우선, 없으면 지번 주소
        const fullAddress = data.roadAddress || data.jibunAddress || data.address;
        
        // 건물명이 있으면 추가
        const addressWithBuilding = data.buildingName 
          ? `${fullAddress} (${data.buildingName})`
          : fullAddress;
        
        onComplete(addressWithBuilding, data);
      },
    }).open();
  }, [isScriptLoaded]);

  return {
    isScriptLoaded,
    openAddressSearch,
  };
}
