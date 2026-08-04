import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

/**
 * Meshy3DService - Commercial Meshy 3D Image-to-3D API Integration
 * Converts 2D garment photos into production-grade hyper-realistic 3D .GLB models!
 */
export class Meshy3DService {
  /**
   * Generates a 3D .GLB garment model from a 2D garment image via Meshy 3D API
   */
  static async generate3DFrom2DImage(imageUrlOrBase64, outputGlbPath, apiKey = '') {
    const meshyApiKey = apiKey || process.env.MESHY_API_KEY || '';

    if (!meshyApiKey) {
      console.warn('⚠️ MESHY_API_KEY is not set. Please set MESHY_API_KEY in .env for real-time Meshy 3D AI generation.');
      return false;
    }

    try {
      console.log('🚀 [Meshy 3D API] Sending 2D Garment Image to Meshy Image-to-3D Neural Server...');

      // 1. Create Image-to-3D Task
      const taskRes = await fetch('https://api.meshy.ai/v2/image-to-3d', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${meshyApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_url: imageUrlOrBase64,
          enable_pbr: true,
          surface_mode: 'hard'
        })
      });

      const taskData = await taskRes.json();
      if (!taskData || !taskData.result) {
        throw new Error(taskData.message || 'Failed to initiate Meshy 3D task');
      }

      const taskId = taskData.result;
      console.log(`⏳ [Meshy 3D API] Task created ID: ${taskId}. Polling for completion...`);

      // 2. Poll Task Status until FINISHED
      let modelGlbUrl = '';
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 3000)); // Poll every 3 seconds

        const statusRes = await fetch(`https://api.meshy.ai/v2/image-to-3d/${taskId}`, {
          headers: { 'Authorization': `Bearer ${meshyApiKey}` }
        });
        const statusData = await statusRes.json();

        if (statusData.status === 'SUCCEEDED') {
          modelGlbUrl = statusData.model_urls.glb;
          console.log('✨ [Meshy 3D API] 3D Garment Model generated successfully:', modelGlbUrl);
          break;
        } else if (statusData.status === 'FAILED') {
          throw new Error(`Meshy 3D task failed: ${statusData.task_error ? statusData.task_error.message : 'Unknown error'}`);
        }
      }

      if (!modelGlbUrl) {
        throw new Error('Meshy 3D generation timed out.');
      }

      // 3. Download generated .GLB binary file to outputGlbPath
      const glbRes = await fetch(modelGlbUrl);
      const arrayBuffer = await glbRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      fs.writeFileSync(outputGlbPath, buffer);
      console.log(`💾 Saved high-precision Meshy 3D GLB model to: ${outputGlbPath}`);
      return true;

    } catch (err) {
      console.error('❌ [Meshy 3D API] Error during 3D generation:', err);
      return false;
    }
  }
}
