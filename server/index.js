const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3004;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 데이터 저장 디렉토리 생성
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 계산 결과 저장 파일 경로
const calculationsFile = path.join(dataDir, 'calculations.json');

// 저장된 계산 결과 읽기
const getCalculations = () => {
  try {
    if (fs.existsSync(calculationsFile)) {
      const data = fs.readFileSync(calculationsFile, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('계산 결과 읽기 오류:', error);
    return [];
  }
};

// 계산 결과 저장
const saveCalculations = (calculations) => {
  try {
    fs.writeFileSync(calculationsFile, JSON.stringify(calculations, null, 2));
    return true;
  } catch (error) {
    console.error('계산 결과 저장 오류:', error);
    return false;
  }
};

// API 라우트

// 건강 상태 확인
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '재산세 계산기 API 서버가 정상 작동 중입니다.' });
});

// 모든 계산 결과 조회
app.get('/api/calculations', (req, res) => {
  try {
    const calculations = getCalculations();
    res.json({ success: true, data: calculations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 특정 계산 결과 조회
app.get('/api/calculations/:id', (req, res) => {
  try {
    const calculations = getCalculations();
    const calculation = calculations.find(c => c.id === req.params.id);
    
    if (!calculation) {
      return res.status(404).json({ success: false, error: '계산 결과를 찾을 수 없습니다.' });
    }
    
    res.json({ success: true, data: calculation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 계산 결과 저장
app.post('/api/calculations', (req, res) => {
  try {
    const { title, propertyData, result } = req.body;
    
    if (!title || !propertyData || !result) {
      return res.status(400).json({ 
        success: false, 
        error: '필수 데이터가 누락되었습니다. (title, propertyData, result)' 
      });
    }
    
    const calculations = getCalculations();
    const newCalculation = {
      id: Date.now().toString(),
      title,
      savedAt: new Date().toISOString(),
      propertyData,
      result
    };
    
    // 최근 20개만 유지
    const updatedCalculations = [newCalculation, ...calculations].slice(0, 20);
    
    if (saveCalculations(updatedCalculations)) {
      res.json({ success: true, data: newCalculation });
    } else {
      res.status(500).json({ success: false, error: '계산 결과 저장에 실패했습니다.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 계산 결과 삭제
app.delete('/api/calculations/:id', (req, res) => {
  try {
    const calculations = getCalculations();
    const filteredCalculations = calculations.filter(c => c.id !== req.params.id);
    
    if (calculations.length === filteredCalculations.length) {
      return res.status(404).json({ success: false, error: '삭제할 계산 결과를 찾을 수 없습니다.' });
    }
    
    if (saveCalculations(filteredCalculations)) {
      res.json({ success: true, message: '계산 결과가 삭제되었습니다.' });
    } else {
      res.status(500).json({ success: false, error: '계산 결과 삭제에 실패했습니다.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 재산세 계산 API (추가적인 서버 사이드 계산이 필요한 경우)
app.post('/api/calculate', (req, res) => {
  try {
    const { propertyData } = req.body;
    
    if (!propertyData) {
      return res.status(400).json({ 
        success: false, 
        error: '계산할 부동산 데이터가 필요합니다.' 
      });
    }
    
    // 여기서 서버 사이드 계산 로직을 수행할 수 있습니다.
    // 현재는 클라이언트에서 계산하므로 간단한 응답만 반환
    res.json({ 
      success: true, 
      message: '계산이 완료되었습니다.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 통계 정보 조회
app.get('/api/statistics', (req, res) => {
  try {
    const calculations = getCalculations();
    
    const stats = {
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
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'API 엔드포인트를 찾을 수 없습니다.' });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  console.error('서버 오류:', error);
  res.status(500).json({ success: false, error: '서버 내부 오류가 발생했습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 재산세 계산기 API 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📊 API 문서: http://localhost:${PORT}/api/health`);
  console.log(`💾 데이터 저장 위치: ${dataDir}`);
});

module.exports = app; 