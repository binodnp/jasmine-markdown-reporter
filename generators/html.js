
/**
Copyright [2020] [Binod Nirvan](http://linkedin.com/in/binodnirvan)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const fs = require('fs').promises
const literals = require('../literals/en.json')

const passedImage = `<img alt="${literals.passed}" src="https://via.placeholder.com/12/0dd969/000000?text=+" style="max-width:100%;">`
const failedImage = `<img alt="${literals.failed}" src="https://via.placeholder.com/12/f54977/000000?text=+" style="max-width:100%;">`

class Generator {
  constructor (data, options) {
    const { title, destination } = options

    this.title = title
    this.data = data
    this.filePath = destination

    this.contents = []
  }

  generateTest (i, test, displaySuite) {
    const { description, duration, status, failedExpectations, suite } = test
    const flag = status === 'passed' ? passedImage : failedImage

    this.contents.push(`\t<li>\n\t\t${flag} ${i}. ${description} (${duration}ms)\n\t</li>`)

    if (displaySuite) {
      this.contents.push(`<strong>${literals.suite}: ${suite}</strong>`)
    }

    const info = []

    if (failedExpectations && failedExpectations.length) {
      for (const expectation of failedExpectations) {
        const { message, stack } = expectation

        if (message) {
          info.push(message)
        }

        if (stack) {
          info.push(stack)
        }
      }

      this.contents.push('\n')
      this.contents.push('```')
      this.contents.push(info.join('\n'))
      this.contents.push('```')
      this.contents.push('\n')
    }
  }

  generateSuite (suite) {
    const { description, duration } = suite
    this.contents.push(`\n<h2>${description} (${duration / 1000}s)</h2>\n`)

    let i = 0

    this.contents.push('<ul>')
    for (const test of suite.tests) {
      i++
      this.generateTest(i, test)
    }
    this.contents.push('</ul>')
  }

  generateSummary () {
    const addRow = (key, value) => {
      const addCell = (text, bold) => {
        this.contents.push('\t\t<td>')
        this.contents.push('\t\t\t' + (bold ? `<strong>${text}</strong>` : text))
        this.contents.push('\t\t</td>')
      }

      this.contents.push('\t<tr>')
      addCell(key, true)
      addCell(value)
      this.contents.push('\t</tr>')
    }

    this.contents.push(`\n<h2>${literals.summary}</h2>\n`)
    this.contents.push('<table>')

    const { overallStatus } = this.data
    const failedTests = this.data.suites
      .map((x) => x.tests)
      .flat()
      .filter((x) => x.failedExpectations && x.failedExpectations.length)
    const status = overallStatus === 'failed' ? `${failedImage} ${failedTests.length} failed` : overallStatus

    addRow(`${literals.suites}`, this.data.suites.length)
    addRow(`${literals.specs}`, this.data.totalTests)
    addRow(`${literals.duration}`, `${this.data.totalTime / 1000}s`)
    addRow(`${literals.status}`, status)

    this.contents.push('</table>\n')

    if (failedTests.length) {
      this.contents.push(`<h3>${literals.whatFailed}</h3>\n`)
      let i = 0

      this.contents.push('<ul>')
      for (const failed of failedTests) {
        i++
        this.generateTest(i, failed, true)
      }
      this.contents.push('</ul>')
    }
  }

  generate () {
    this.contents.push(`<h1>${this.title}</h1>`)

    for (const suite of this.data.suites) {
      this.generateSuite(suite)
    }

    this.generateSummary()
  }

  async write () {
    this.generate()
    const contents = this.contents.join('\n')

    try {
      await fs.writeFile(this.filePath, contents, { encoding: 'utf-8' })
    } catch (error) {
      console.error(error)
    }
  }
}

module.exports = Generator
