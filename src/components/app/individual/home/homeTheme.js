/** Soft tile backgrounds, cycled by index so neighbouring tiles never share a colour. */
const PASTELS = [
  'bg-[#E9F7EF]',
  'bg-[#FFF3E2]',
  'bg-[#EAF1FF]',
  'bg-[#F3EDFF]',
  'bg-[#FFEDEF]',
  'bg-[#E6F8F6]',
]

export function pastelAt(index) {
  return PASTELS[Math.abs(index) % PASTELS.length]
}
