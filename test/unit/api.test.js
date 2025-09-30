const request = require('supertest');
const path = require('path');
const fs = require('fs');

const baseURL = 'http://localhost:4000';

describe('API Integration Tests', () => {
  let authToken;
  let candidateId;
  let evaluateId;
  let jobId = 3;
  
  // Path file dummy
  const cvDummyFilePath = path.join(__dirname, '../tmp_file/ahmad_cv_dummy.txt');
  const projectDummyFilePath = path.join(__dirname, '../tmp_file/ahmad_project_dummy.txt');

  // login
  beforeAll(async () => {
    console.log('🔐 Logging in...');
    const loginResponse = await request(baseURL)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'password'
      });
    
    expect(loginResponse.status).toBe(200);

    authToken = loginResponse.body.token || 
      loginResponse.body.accessToken || 
      loginResponse.body.access_token ||
      loginResponse.body.authToken ||
      loginResponse.body.data.token;
    console.log('✅ Login successful');
    console.log('Response: ', loginResponse.body)
  });
  
  // test /api/v1/upload
  test('POST /api/v1/upload - Upload CV', async () => {
    expect(fs.existsSync(cvDummyFilePath)).toBe(true);
    expect(fs.existsSync(projectDummyFilePath)).toBe(true);
    
    const response = await request(baseURL)
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${authToken}`) // JWT Header
      .attach('cv_file', cvDummyFilePath)
      .attach('project_file', projectDummyFilePath);
    
    expect(response.status).toBe(201);
    candidateId = response.body.data.id;
    console.log('✅ Upload successful');
    console.log('Response: ', response.body);
  });
  
  // test /api/v1/evaluate
  test('POST /api/v1/evaluate - Evaluate CV', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await request(baseURL)
      .post('/api/v1/evaluate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        candidateId,
        jobId
      });
    
    expect(response.status).toBe(200);
    evaluateId = response.body.data.id
    console.log('✅ Evaluation successful');
    console.log('Response: ', response.body);
  });

  // test /api/v1/evaluate - evaluation status PROCESSING
  test('POST /api/v1/evaluate/result/{id} - Result Evaluation', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await request(baseURL)
      .get(`/api/v1/evaluate/result/${evaluateId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    console.log('✅ Evaluation successful');
    console.log('Response: ', response.body);
  });

  // test /api/v1/evaluate - expevted evaluation status COMPLETED
  test('POST /api/v1/evaluate/result/{id} - Result Evaluation Response From AI/ML', async () => {
    await new Promise(resolve => setTimeout(resolve, 7000));
    
    const response = await request(baseURL)
      .get(`/api/v1/evaluate/result/${evaluateId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    console.log('✅ Evaluation successful');
    console.log('Response: ', response.body);
  }, 15000);
});
