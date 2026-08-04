import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

/**
 * Meshy3DService - Commercial Meshy Multi-View 3D AI Integration
 * Converts 2D multi-view garment photos (Front, Back, Sleeves) into hyper-realistic 3D .GLB models!
 */
export class Meshy3DService {
  /**
   * Generates a high-precision 3D .GLB garment model from 2D images via Meshy 3D API
   */
  static async generate3DFrom2DImage(imageInput, outputGlbPath, apiKey = '') {
    const meshyApiKey = apiKey || process.env.MESHY_API_KEY || '';

    if (!meshyApiKey) {
      console.warn('⚠️ MESHY_API_KEY is missing.');
      throw new Error('Meshy API Key가 필요합니다. Meshy.ai에서 무료 발급받으신 API Key를 입력해 주세요.');
    }

    try {
      console.log('🚀 [Meshy 3D Multi-View API] Sending 2D Garment Images to Meshy AI Server...');

      // Prepare request payload for Meshy Image-to-3D API
      const requestBody = {
        mode: 'preview',
        art_style: 'realistic',
        enable_pbr: true,
        should_remesh: true
      };

      if (typeof imageInput === 'object' && imageInput.front) {
        requestBody.image_url = imageInput.front;
        if (imageInput.back) requestBody.back_image_url = imageInput.back;
        if (imageInput.left_sleeve) requestBody.left_image_url = imageInput.left_sleeve;
        if (imageInput.right_sleeve) requestBody.right_image_url = imageInput.right_sleeve;
      } else {
        requestBody.image_url = imageInput;
      }

      // 1. Create Image-to-3D Task
      const taskRes = await fetch('https://api.meshy.ai/v2/image-to-3d', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${meshyApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const taskData = await taskRes.json();
      if (!taskRes.ok || !taskData.result) {
        throw new Error(taskData.message || taskData.error || 'Meshy 3D API 태스크 생성 실패');
      }

      const taskId = taskData.result;
      console.log(`⏳ [Meshy 3D API] Task ID: ${taskId}. Polling for 3D GLB model completion...`);

      // 2. Poll Task Status until SUCCEEDED
      let modelGlbUrl = '';
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 2500)); // Poll every 2.5s

        const statusRes = await fetch(`https://api.meshy.ai/v2/image-to-3d/${taskId}`, {
          headers: { 'Authorization': `Bearer ${meshyApiKey}` }
        });
        const statusData = await statusRes.json();

        if (statusData.status === 'SUCCEEDED') {
          modelGlbUrl = statusData.model_urls.glb || statusData.model_urls.fbx;
          console.log('✨ [Meshy 3D API] 3D Garment Model generated successfully:', modelGlbUrl);
          break;
        } else if (statusData.status === 'FAILED') {
          throw new Error(`Meshy 3D 생성 실패: ${statusData.task_error ? statusData.task_error.message : 'Unknown error'}`);
        }
      }

      if (!modelGlbUrl) {
        throw new Error('Meshy 3D 모델 생성 시간이 초과되었습니다.');
      }

      // 3. Download generated .GLB binary file to outputGlbPath
      const glbRes = await fetch(modelGlbUrl);
      const arrayBuffer = await glbRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      fs.writeFileSync(outputGlbPath, buffer);
      console.log(`💾 Saved high-precision Meshy 3D GLB model to: ${outputGlbPath}`);
      return { success: true, glbPath: outputGlbPath };

    } catch (err) {
      console.error('❌ [Meshy 3D API] Error during 3D generation:', err);
      throw err;
    }
  }
}
