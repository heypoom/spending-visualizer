import { createSignal } from "solid-js"

export default function Home() {
  const [count, setCount] = createSignal(0)

  return (
    <div>
      <div class="flex items-center justify-center min-h-screen">
        <div class="flex flex-col items-center gap-y-6">
          <div class="border border-bg-gray-400 border-width-8 w-28 h-28 rounded-full flex items-center justify-center">
            <i class="fa-solid fa-file-arrow-up fa-3x"></i>
          </div>

          <div class="m-4 text-3xl">อัพโหลดเอกสาร Statement ที่นี่</div>
        </div>
      </div>
    </div>
  )
}
