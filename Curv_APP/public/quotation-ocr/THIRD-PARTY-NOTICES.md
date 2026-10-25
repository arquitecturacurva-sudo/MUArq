# Curv OCR - self-hosted recognition resources

Curv reconstructs construction quotation tables and interprets their fields with its own application code. Character recognition uses the following open components, without an inference service.

| Component | Version / profile | Upstream | License |
| --- | --- | --- | --- |
| Tesseract.js worker | 5.1.1 | https://github.com/naptha/tesseract.js | Apache-2.0 |
| Tesseract.js-core | 5.1.1 | https://github.com/naptha/tesseract.js-core | Apache-2.0 |
| Spanish and English language data | @tesseract.js-data/spa and eng 1.0.0, 4.0.0_best_int | https://github.com/naptha/tessdata | Apache-2.0 trained data; npm package metadata declares MIT |

The complete Apache license is included in LICENSE-Apache-2.0.txt. The versioned manifest records exact source paths, lengths and SHA-256 digests. Language files are vendored; worker/core resources are copied from locked npm dependencies by scripts/prepare-quotation-ocr.mjs. Do not replace these files with unversioned CDN URLs.

The worker bundle additionally includes notices for buffer (Feross Aboukhadijeh, MIT), ieee754 (Feross Aboukhadijeh, BSD-3-Clause), regenerator-runtime (Facebook, Inc., MIT), and zlib.js (imaya, MIT). Its original worker.min.js.LICENSE.txt is served alongside the bundle.

## MIT license for bundled MIT components and language npm packaging

Copyright (c) the respective upstream authors and contributors named above.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## BSD-3-Clause license for ieee754

Copyright (c) 2008, Fair Oaks Labs, Inc. All rights reserved.
Copyright (c) 2011-2014, DeNA Co., Ltd. All rights reserved.
Copyright (c) 2014, Feross Aboukhadijeh. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
