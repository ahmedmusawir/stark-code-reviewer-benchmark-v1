# CR-BENCH-01 — Blind Fidelity Report

Created: 2026-09-10 12:13:41 +06

Method: each blinded file was compared line-by-line against its original using a sequence diff. A difference is *explained* only if it is a one-to-one line replacement in which the original line contains contestant identity text, the replacement line contains `[BLINDED REVIEWER]`, and no identity text remains. Any insertion, deletion, or replacement not meeting that test is counted as unexplained. Line counts must match.

| Blind ID | Original SHA-256 | Blinded SHA-256 | Identity redaction count | Unexplained differences | Original lines | Blinded lines | Fidelity verdict |
|---|---|---|---|---|---|---|---|
| REVIEWER_A | `ea3b896425e9f302e1c1d154b7110ba8057f5f88ea143795c30dc31b2c4b8a1e` | `4943c7a8e20edff37d6391438cd591e8898f20cc5750a41f71cc078fe8ec8748` | 1 | 0 | 899 | 899 | PASS |
| REVIEWER_B | `b4005b5acc7f96337f0f80ad6988e768fbb04a3df63c75543b639914e143ecc5` | `b4005b5acc7f96337f0f80ad6988e768fbb04a3df63c75543b639914e143ecc5` | 0 | 0 | 211 | 211 | PASS |
| REVIEWER_C | `ad2d7093e87d8b9cae37a74b3d3cdf7e2b56f5aef93509bb80f36e0bef7d4c4f` | `008d3b0494afdf0752373470f48ca8ac74ba36fa1e4c604c920af28414fc646b` | 1 | 0 | 190 | 190 | PASS |
| REVIEWER_D | `a180156b580bf2420d1962998ada3511b345c56fe910286f7f3005862b9476c1` | `9e7d73478aec1e0d68640ce67736da2408b7eb0a78e87200d8a7ad4663dca2eb` | 2 | 0 | 314 | 314 | PASS |
| REVIEWER_E | `3104c5e20de1ae6313564ba2c79681916f3eeaac24add4ccd59d6420468cc2d7` | `dc1390ed8c01b717855bc5ca1b6acc653480535aac27ee07a870ced9f835d738` | 2 | 0 | 331 | 331 | PASS |
| REVIEWER_F | `844caff1256d1df1ff47cfca76b32a94a3ee9c190b3fd9e43fec102146d9f6c5` | `855f0c19683e2a34d00a6f7b566273bfed640a4b6665a12311a96d486234d682` | 1 | 0 | 240 | 240 | PASS |

Post-blinding identity scan of `referee/blind/` (case-insensitive: kimi, minimax, glm, deepseek): 0 occurrences.

Original report SHA-256 values were cross-checked against the hashes recorded in each contestant's RUN_NOTES.md at closeout: all six match.
