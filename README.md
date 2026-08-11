# PS&E Bank Wealth Platform

**Live:** https://pse-wealth-platform.vercel.app  
**Marketing site:** https://pse-bank-website.vercel.app  
**Support:** psebank@pm.me

## Product rules

- New accounts start with **no transaction history** (empty activity feed)
- Activity only lists transactions the user actually creates in-app
- Support contact uses **psebank@pm.me** (not personal Gmail on the product UI)
- Stripe top-ups available in **test mode** payment links where configured

## Features

- Register / OTP verify / login (local multi-user)
- Dashboard balances & account number
- Send / receive internal transfers
- Crypto buy calculator flows
- Gift card purchase flows (in-platform balance debit + activity record)
- Virtual cards view
- Link-bank UI (platform workflow — not a substitute for licensed bank aggregation)
- More actions grid

## Honest scope

This is the PS&E **platform product UI**. Real Visa issuance, FDIC insurance, live retail gift-card code delivery, and live bank logins require licensed partners, compliance approval, and production processor credentials. Do not present demo UI as regulated banking unless those partners are in place.

## Stack

Next.js 15 · React 19 · TypeScript · Vercel

**GitHub:** pointgoddesscc-sketch/pse-wealth-platform
