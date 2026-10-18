import {
  LuActivity,
  LuBaby,
  LuBone,
  LuBrain,
  LuEar,
  LuEye,
  LuHeart,
  LuHeartPulse,
  LuScissors,
  LuSmile,
  LuSparkles,
  LuStethoscope,
} from 'react-icons/lu'

const MAP = {
  stethoscope: LuStethoscope,
  baby: LuBaby,
  activity: LuActivity,
  heart: LuHeart,
  scissors: LuScissors,
  ear: LuEar,
  eye: LuEye,
  smile: LuSmile,
  heartPulse: LuHeartPulse,
  sparkles: LuSparkles,
  brain: LuBrain,
  bone: LuBone,
}

export function SpecialtyIcon({ icon, className = '' }) {
  const Icon = MAP[icon] ?? LuStethoscope
  return <Icon aria-hidden className={className} />
}

/** 3D illustrations exported from the MediMeet Figma file. */
export const illo = (name) => `/img/icon-${name}.png`
