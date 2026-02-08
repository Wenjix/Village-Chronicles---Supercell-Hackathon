import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Patch three-stdlib's FBXLoader to survive FBX files with missing bone/deformer data.
// Several `.a` property accesses crash on undefined objects (TransformLink, Matrix, FullWeights).
function patchFBXLoader() {
  return {
    name: 'patch-fbx-loader',
    transform(code, id) {
      if (!id.includes('FBXLoader')) return null

      let patched = code
      // boneNode.TransformLink.a → (boneNode.TransformLink || {a:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}).a
      patched = patched.replace(
        /boneNode\.TransformLink\.a/g,
        '(boneNode.TransformLink || {a:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}).a'
      )
      // poseNode.Matrix.a and poseNodes.Matrix.a
      patched = patched.replace(
        /poseNode(s?)\.Matrix\.a/g,
        '(poseNode$1.Matrix || {a:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}).a'
      )
      // morphTargetNode.FullWeights.a
      patched = patched.replace(
        /morphTargetNode\.FullWeights\.a/g,
        '(morphTargetNode.FullWeights || {a:[]}).a'
      )

      if (patched !== code) {
        return { code: patched, map: null }
      }
      return null
    }
  }
}

export default defineConfig({
  plugins: [patchFBXLoader(), react(), tailwindcss()],
  assetsInclude: ['**/*.fbx', '**/*.glb', '**/*.gltf'],
})
