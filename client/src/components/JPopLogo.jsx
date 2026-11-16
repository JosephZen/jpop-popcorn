"use client";

import React from 'react';

export const JPopLogo = ({ width = 48, height = 48, className = '', style = {} }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width={width}
      height={height}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <defs>
        {/* Kernels Butter & Gold Gradients */}
        <linearGradient id="jpopPopcornGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF9D2" />
          <stop offset="45%" stopColor="#F9CA24" />
          <stop offset="100%" stopColor="#E09F07" />
        </linearGradient>
        <linearGradient id="jpopPopcornButter" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FFF099" />
          <stop offset="100%" stopColor="#F6B93B" />
        </linearGradient>
        {/* Classic Box Red & Yellow Gradients */}
        <linearGradient id="boxRed" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D63031" />
          <stop offset="50%" stopColor="#FF3838" />
          <stop offset="100%" stopColor="#B71540" />
        </linearGradient>
        <linearGradient id="boxYellow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F9CA24" />
          <stop offset="50%" stopColor="#FFD32A" />
          <stop offset="100%" stopColor="#F1C40F" />
        </linearGradient>
        <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFF2D6" />
        </linearGradient>
        <filter id="boxShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000000" floodOpacity="0.25" />
        </filter>
        <filter id="cloudShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#8B1A1A" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* ─── Back Popcorn Overflow Clusters ─── */}
      <g id="popcorn-back">
        <circle cx="170" cy="140" r="38" fill="url(#jpopPopcornGold)" />
        <circle cx="230" cy="115" r="45" fill="url(#jpopPopcornGold)" />
        <circle cx="285" cy="110" r="42" fill="url(#jpopPopcornGold)" />
        <circle cx="340" cy="140" r="36" fill="url(#jpopPopcornGold)" />
        <circle cx="125" cy="170" r="32" fill="url(#jpopPopcornGold)" />
        <circle cx="375" cy="165" r="32" fill="url(#jpopPopcornGold)" />
      </g>

      {/* ─── Front Overflown Popped Kernels ─── */}
      <g id="popcorn-front">
        {/* Kernel 1 (Left) */}
        <path
          d="M 125 180 C 110 155 135 125 160 135 C 175 120 200 135 195 155 C 210 165 205 190 185 198 C 165 205 135 200 125 180 Z"
          fill="url(#jpopPopcornButter)"
          stroke="#E09F07"
          strokeWidth="3"
        />
        {/* Kernel 2 (Center Left) */}
        <path
          d="M 180 150 C 170 120 205 95 230 115 C 255 95 285 120 270 145 C 290 160 275 190 250 185 C 225 195 195 180 180 150 Z"
          fill="url(#jpopPopcornButter)"
          stroke="#E09F07"
          strokeWidth="3.5"
        />
        {/* Kernel 3 (Center Right Top) */}
        <path
          d="M 270 130 C 265 105 295 90 320 105 C 345 95 370 120 355 145 C 375 160 360 190 335 185 C 315 195 285 175 270 130 Z"
          fill="url(#jpopPopcornButter)"
          stroke="#E09F07"
          strokeWidth="3"
        />
        {/* Kernel 4 (Right) */}
        <path
          d="M 330 160 C 325 135 355 120 375 135 C 395 125 415 150 400 175 C 415 190 395 215 375 205 C 355 215 330 190 330 160 Z"
          fill="url(#jpopPopcornButter)"
          stroke="#E09F07"
          strokeWidth="3"
        />
        {/* Kernel 5 (Center Burst Kernel) */}
        <path
          d="M 215 175 C 200 150 225 130 250 140 C 270 125 295 140 290 165 C 305 180 290 210 265 205 C 240 215 220 200 215 175 Z"
          fill="url(#jpopPopcornGold)"
          stroke="#B37700"
          strokeWidth="3"
        />
      </g>

      {/* ─── Classic Red & Yellow Vertical Striped Popcorn Box ─── */}
      <g id="popcorn-box" filter="url(#boxShadow)">
        {/* Outer Red Box Body */}
        <path
          d="M 125 215 L 155 450 C 157 458 165 464 175 464 L 325 464 C 335 464 343 458 345 450 L 375 215 Z"
          fill="url(#boxRed)"
        />

        {/* Yellow Vertical Stripes */}
        {/* Stripe 1 */}
        <polygon points="152,215 178,215 198,464 176,464" fill="url(#boxYellow)" />
        {/* Stripe 2 */}
        <polygon points="214,215 240,215 246,464 224,464" fill="url(#boxYellow)" />
        {/* Stripe 3 */}
        <polygon points="274,215 300,215 292,464 270,464" fill="url(#boxYellow)" />
        {/* Stripe 4 */}
        <polygon points="334,215 360,215 338,464 316,464" fill="url(#boxYellow)" />

        {/* Box Scalloped / Rim Lip */}
        <path
          d="M 120 215 C 130 210 145 210 155 215 C 165 210 180 210 190 215 C 200 210 215 210 225 215 C 235 210 250 210 260 215 C 270 210 285 210 295 215 C 305 210 320 210 330 215 C 340 210 355 210 365 215 C 375 210 385 215 385 218 L 375 228 L 125 228 Z"
          fill="#FFF9D2"
          stroke="#E09F07"
          strokeWidth="2"
        />
      </g>

      {/* ─── Central Front Cloud Emblem with ONLY "J-Pop" ─── */}
      <g id="cloud-emblem" filter="url(#cloudShadow)">
        {/* Cloud Outline & Body */}
        <path
          d="M 180 340
             C 160 340 145 322 152 302
             C 145 285 158 262 180 260
             C 192 238 222 232 242 246
             C 255 235 278 235 292 248
             C 312 236 342 248 348 272
             C 365 282 368 308 355 325
             C 362 338 350 352 335 352
             C 325 365 300 368 285 358
             C 270 368 240 368 225 358
             C 210 366 188 360 180 340 Z"
          fill="url(#cloudGrad)"
          stroke="#FFD32A"
          strokeWidth="6"
        />
        <path
          d="M 182 338
             C 164 338 150 322 156 304
             C 150 288 162 266 182 264
             C 193 244 220 238 238 251
             C 250 241 271 241 284 253
             C 302 242 330 253 335 275
             C 350 284 353 308 341 323
             C 347 335 336 348 322 348
             C 313 360 290 363 276 354
             C 262 363 234 363 220 354
             C 206 361 187 356 182 338 Z"
          fill="none"
          stroke="#C23616"
          strokeWidth="2.5"
          opacity="0.8"
        />

        {/* Central Bold & Playful "J-Pop" Typography ONLY */}
        <text
          x="250"
          y="322"
          textAnchor="middle"
          fontFamily="'Arial Black', 'Impact', 'Montserrat', sans-serif"
          fontSize="56"
          fontWeight="900"
          letterSpacing="1.5"
          fill="#C23616"
          stroke="#FFEAA7"
          strokeWidth="2.5"
        >
          J-Pop
        </text>
      </g>
    </svg>
  );
};

export default JPopLogo;
