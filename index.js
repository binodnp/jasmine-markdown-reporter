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

const path = require('path')
const generators = require('./generators')
const literals = require('./literals/en.json')

class MarkdownReporter {
  constructor (options) {
    this.options = options || {}

    if (!this.options.destination) {
      const destination = path.resolve(path.join(process.cwd(), 'story.md'))
      this.options.destination = destination
    }

    if (!this.options.title) {
      this.options.title = literals.title
    }

    this.totalTests = 0
    this.suites = []
    this.lastSuite = ''
    this.html = (options.mode || '').toString().toLowerCase() === 'html' || false
  }

  jasmineStarted (suite) {
    this.totalTests = suite.totalSpecsDefined
    this.seed = suite.seed
    this.random = suite.random
  }

  suiteStarted (suite) {
    this.suites.push({
      id: suite.id,
      description: suite.description,
      duration: 0,
      status: 'Unknown',
      tests: []
    })

    this.lastSuite = suite.id
  }

  suiteDone (suite) {
    const found = this.suites.find((x) => x.id === suite.id)

    found.duration = suite.duration
    found.status = suite.status
    found.failedExpectations = suite.failedExpectations

    this.lastSuite = ''
  }

  specDone (spec) {
    const found = this.suites.find((x) => x.id === this.lastSuite)

    found.tests.push({
      id: spec.id,
      description: spec.description,
      suite: found.description,
      duration: spec.duration,
      pendingReason: spec.pendingReason,
      properties: spec.properties,
      status: spec.status,
      failedExpectations: spec.failedExpectations,
      passedExpectations: spec.passedExpectations
    })
  }

  async jasmineDone (x) {
    const result = {
      totalTests: this.totalTests,
      seed: this.seed,
      random: this.random,
      totalTime: x.totalTime,
      incompleteReason: x.incompleteReason,
      overallStatus: x.overallStatus,
      failedExpectations: x.failedExpectations,
      deprecationWarnings: x.deprecationWarnings,
      suites: this.suites
    }

    const Mode = this.html ? generators.html : generators.markdown
    const generator = new Mode(result, this.options)
    await generator.write()
  }
}

module.exports = MarkdownReporter
