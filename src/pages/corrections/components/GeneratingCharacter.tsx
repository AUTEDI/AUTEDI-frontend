import bubble from '../../../assets/design-system/character/bubble.svg'
import eyeLeftShine from '../../../assets/design-system/character/eye-left-shine.svg'
import eyeLeft from '../../../assets/design-system/character/eye-left.svg'
import eyeLid from '../../../assets/design-system/character/eye-lid.svg'
import eyeRightShine from '../../../assets/design-system/character/eye-right-shine.svg'
import eyeRight from '../../../assets/design-system/character/eye-right.svg'
import underline from '../../../assets/design-system/character/underline.svg'

/** 두 눈. 위치·크기는 피그마 값 그대로이고, 눈꺼풀만 깜빡인다. */
const EYES = [
  { left: 46, width: 20, height: 35.333, eye: eyeLeft, eyeInset: 'inset-[0_0_0.07%_0]', shine: eyeLeftShine, shineTop: 'top-[calc(50%-2.67px)]', lid: 'top-[-32.08%] bottom-[75.47%]' },
  { left: 79.33, width: 19.999, height: 35, eye: eyeRight, eyeInset: 'inset-[0_0_0_-0.01%]', shine: eyeRightShine, shineTop: 'top-[calc(50%-2.5px)]', lid: 'top-[-32.38%] bottom-[75.24%]' },
] as const

/** 상자(inset으로 위치)를 꽉 채우는 그림. img는 inset만으로는 늘어나지 않아 상자로 감싼다. */
const Fill = ({ src, inset }: { src: string; inset: string }) => (
  <div className={`absolute ${inset}`}>
    <img src={src} alt="" className="block size-full max-w-none" />
  </div>
)

/**
 * AI 첨삭 생성 중 캐릭터(160px). 피그마 모션(2초 반복)을 옮겨 말풍선이 갸웃거리고 눈을 깜빡인다.
 * 멈출 때(동작 줄이기 설정, 완료·실패)는 첫 장면에 선다.
 */
export default function GeneratingCharacter({ animated }: { animated: boolean }) {
  return (
    <div aria-hidden="true" className="relative size-[160px]">
      <div className="absolute inset-[85.42%_46.88%_14.58%_15.63%]">
        <Fill src={underline} inset="inset-[-3.33px_-5.56%]" />
      </div>
      <div
        className={`absolute top-[28.33px] left-[20px] h-[100px] w-[120px] origin-center [translate:0_0.113px] ${
          animated ? 'motion-safe:animate-character' : ''
        }`}
      >
        <div className="absolute inset-[calc(17.71%-17.71px)_calc(12.5%-15px)_calc(19.79%-19.79px)_calc(12.5%-15px)]">
          <Fill src={bubble} inset="inset-[0_0_2.43%_0]" />
        </div>
        {EYES.map((item) => (
          <div
            key={item.left}
            className="absolute top-[31.67px] overflow-clip rounded-[6.667px]"
            style={{ left: item.left, width: item.width, height: item.height }}
          >
            <Fill src={item.eye} inset={item.eyeInset} />
            <div className={`absolute right-[8.89%] left-[7.78%] aspect-[10/14] -translate-y-1/2 ${item.shineTop}`}>
              <Fill src={item.shine} inset="inset-[10.27%_6.59%_12.14%_6.16%]" />
            </div>
            {/* 눈꺼풀: 가로 가운데 맞춤은 transform, 깜빡임은 translate 속성으로 따로 건다. */}
            <div
              className={`absolute left-1/2 w-[21.333px] [transform:translateX(-50%)] [translate:0_-8.779px] ${item.lid} ${
                animated ? 'motion-safe:animate-character-blink' : ''
              }`}
            >
              <Fill src={eyeLid} inset="inset-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
