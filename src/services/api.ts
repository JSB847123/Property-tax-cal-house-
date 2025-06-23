import axios from 'axios';
import { PropertyData, CalculationResult, SavedCalculation } from '@/types/propertyTax';

// API 기본 설정
const API_BASE_URL = 'http://localhost:3004/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터로 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API 요청 오류:', error);
    
    if (error.response) {
      // 서버가 응답했지만 에러 상태 코드
      throw new Error(error.response.data?.error || '서버 오류가 발생했습니다.');
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못함
      throw new Error('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
    } else {
      // 요청 설정 중 오류
      throw new Error('요청 처리 중 오류가 발생했습니다.');
    }
  }
);

// API 서비스 인터페이스
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CalculationStats {
  totalCalculations: number;
  propertyTypes: Record<string, number>;
  averageTax: number;
  recentCalculations: Array<{
    id: string;
    title: string;
    savedAt: string;
  }>;
}

// API 서비스 클래스
class ApiService {
  // 서버 상태 확인
  async checkHealth(): Promise<{ status: string; message: string }> {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // 모든 계산 결과 조회
  async getCalculations(): Promise<SavedCalculation[]> {
    try {
      const response = await apiClient.get<ApiResponse<SavedCalculation[]>>('/calculations');
      return response.data.data || [];
    } catch (error) {
      console.warn('서버에서 계산 결과를 가져올 수 없습니다. 로컬 스토리지를 사용합니다.');
      // 서버 연결 실패 시 로컬 스토리지 사용
      return this.getLocalCalculations();
    }
  }

  // 특정 계산 결과 조회
  async getCalculation(id: string): Promise<SavedCalculation | null> {
    try {
      const response = await apiClient.get<ApiResponse<SavedCalculation>>(`/calculations/${id}`);
      return response.data.data || null;
    } catch (error) {
      console.warn('서버에서 계산 결과를 가져올 수 없습니다.');
      return null;
    }
  }

  // 계산 결과 저장
  async saveCalculation(
    title: string,
    propertyData: PropertyData,
    result: CalculationResult
  ): Promise<SavedCalculation> {
    try {
      const response = await apiClient.post<ApiResponse<SavedCalculation>>('/calculations', {
        title,
        propertyData,
        result,
      });
      
      if (response.data.success && response.data.data) {
        // 서버 저장 성공 시 로컬 스토리지에도 백업
        this.saveToLocalStorage(response.data.data);
        return response.data.data;
      } else {
        throw new Error('서버 저장에 실패했습니다.');
      }
    } catch (error) {
      console.warn('서버 저장 실패. 로컬 스토리지에 저장합니다.');
      // 서버 저장 실패 시 로컬 스토리지에만 저장
      return this.saveToLocalStorage({
        id: Date.now().toString(),
        title,
        savedAt: new Date().toISOString(),
        propertyData,
        result,
      });
    }
  }

  // 계산 결과 삭제
  async deleteCalculation(id: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<any>>(`/calculations/${id}`);
      if (response.data.success) {
        // 서버 삭제 성공 시 로컬 스토리지에서도 삭제
        this.deleteFromLocalStorage(id);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('서버에서 삭제할 수 없습니다. 로컬에서만 삭제합니다.');
      return this.deleteFromLocalStorage(id);
    }
  }

  // 통계 정보 조회
  async getStatistics(): Promise<CalculationStats | null> {
    try {
      const response = await apiClient.get<ApiResponse<CalculationStats>>('/statistics');
      return response.data.data || null;
    } catch (error) {
      console.warn('서버에서 통계를 가져올 수 없습니다.');
      return this.getLocalStatistics();
    }
  }

  // 계산 요청 (서버 사이드 계산이 필요한 경우)
  async performCalculation(propertyData: PropertyData): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/calculate', {
        propertyData,
      });
      return response.data.success;
    } catch (error) {
      console.warn('서버 계산 요청 실패:', error);
      return false;
    }
  }

  // 로컬 스토리지 관련 메서드들
  private getLocalCalculations(): SavedCalculation[] {
    try {
      const saved = localStorage.getItem('propertyTaxCalculations');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('로컬 스토리지 읽기 오류:', error);
      return [];
    }
  }

  private saveToLocalStorage(calculation: SavedCalculation): SavedCalculation {
    try {
      const calculations = this.getLocalCalculations();
      const updatedCalculations = [calculation, ...calculations.filter(c => c.id !== calculation.id)].slice(0, 20);
      localStorage.setItem('propertyTaxCalculations', JSON.stringify(updatedCalculations));
      return calculation;
    } catch (error) {
      console.error('로컬 스토리지 저장 오류:', error);
      throw new Error('계산 결과 저장에 실패했습니다.');
    }
  }

  private deleteFromLocalStorage(id: string): boolean {
    try {
      const calculations = this.getLocalCalculations();
      const filteredCalculations = calculations.filter(c => c.id !== id);
      localStorage.setItem('propertyTaxCalculations', JSON.stringify(filteredCalculations));
      return true;
    } catch (error) {
      console.error('로컬 스토리지 삭제 오류:', error);
      return false;
    }
  }

  private getLocalStatistics(): CalculationStats {
    const calculations = this.getLocalCalculations();
    
    const stats: CalculationStats = {
      totalCalculations: calculations.length,
      propertyTypes: {},
      averageTax: 0,
      recentCalculations: calculations.slice(0, 5).map(c => ({
        id: c.id,
        title: c.title,
        savedAt: c.savedAt
      }))
    };

    // 부동산 유형별 통계
    calculations.forEach(calc => {
      const type = calc.propertyData?.propertyType || '미분류';
      stats.propertyTypes[type] = (stats.propertyTypes[type] || 0) + 1;
    });

    // 평균 세액 계산
    if (calculations.length > 0) {
      const totalTax = calculations.reduce((sum, calc) => {
        return sum + (calc.result?.yearTotal || 0);
      }, 0);
      stats.averageTax = Math.round(totalTax / calculations.length);
    }

    return stats;
  }
}

// 싱글톤 인스턴스 생성
export const apiService = new ApiService();

// 개별 함수들도 export (기존 코드와의 호환성을 위해)
export const checkServerHealth = () => apiService.checkHealth();
export const getCalculations = () => apiService.getCalculations();
export const getCalculation = (id: string) => apiService.getCalculation(id);
export const saveCalculation = (title: string, propertyData: PropertyData, result: CalculationResult) =>
  apiService.saveCalculation(title, propertyData, result);
export const deleteCalculation = (id: string) => apiService.deleteCalculation(id);
export const getStatistics = () => apiService.getStatistics();
export const performCalculation = (propertyData: PropertyData) => apiService.performCalculation(propertyData);

export default apiService; 