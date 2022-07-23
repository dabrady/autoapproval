// You can import your modules
// import index from '../src/index'

import nock from 'nock'
// Requiring our app implementation
const myProbotApp = require('../src')
const { Probot, ProbotOctokit } = require('probot')

nock.disableNetConnect()

describe('Autoapproval bot', () => {
  let probot: any

  beforeEach(() => {
    probot = new Probot({
      githubToken: 'test',
      // Disable throttling & retrying requests for easier testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false }
      })
    })
    myProbotApp(probot)
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  test('PR has missing blacklisted_labels -> will be approved', async () => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels:
        - merge
      apply_labels: []
    `
    const reviews = require('./fixtures/pull_request_reviews_empty.json')

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dabrady/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR has blacklisted labels -> will NOT be approved', async () => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels:
        - merge
      apply_labels: []
      blacklisted_labels:
        - wip
    `

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR has no required labels -> will NOT be approved', async () => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels:
        - ready
      apply_labels: []
      blacklisted_labels: []
    `

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR has not all required labels -> will NOT be approved', async () => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels:
        - ready
        - ready2
      apply_labels: []
      blacklisted_labels: []
    `

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR has no expected owner -> will NOT be approved', async () => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - blabla
      required_labels:
        - merge
      apply_labels: []
      blacklisted_labels: []
    `

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR has required labels and expected owner -> will be approved', async () => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels:
        - merge
      apply_labels: []
      blacklisted_labels: []
    `
    const reviews = require('./fixtures/pull_request_reviews_empty.json')

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dabrady/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR has multiple required labels and expected owner -> will be approved', async () => {
    const payload = require('./fixtures/pull_request_opened_multiple_labels.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels:
        - merge
        - merge2
      apply_labels: []
      blacklisted_labels: []
    `
    const reviews = require('./fixtures/pull_request_reviews_empty.json')

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dabrady/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR has one of multiple required labels and expected owner -> will be approved', async () => {
    const payload = require('./fixtures/pull_request_opened_multiple_labels.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels:
        - merge
        - merge2
      required_labels_mode: one_of
      apply_labels: []
      blacklisted_labels: []
    `
    const reviews = require('./fixtures/pull_request_reviews_empty.json')

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dabrady/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR approved and label is applied', async () => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels: []
      apply_labels:
        - done
      blacklisted_labels: []
    `
    const reviews = require('./fixtures/pull_request_reviews_empty.json')

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dabrady/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    nock('https://api.github.com')
      .post('/repos/dabrady/autoapproval/issues/1/labels', (body: any) => {
        return body.labels.includes('done')
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR approved and auto merge is enabled', async () => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels: []
      apply_labels: []
      blacklisted_labels: []
      auto_merge_labels:
        - merge
    `
    const reviews = require('./fixtures/pull_request_reviews_empty.json')

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dabrady/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    nock('https://api.github.com')
      .post('/graphql', (body: any) => {
        return body.variables.pullRequestId === 'MDExOlB1bGxSZXF1ZN0NjExMzU2MTgy' &&
           body.variables.mergeMethod === 'MERGE'
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR approved and auto merge squash is enabled', async () => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels: []
      apply_labels: []
      blacklisted_labels: []
      auto_squash_merge_labels:
        - merge
    `
    const reviews = require('./fixtures/pull_request_reviews_empty.json')

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dabrady/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    nock('https://api.github.com')
      .post('/graphql', (body: any) => {
        return body.variables.pullRequestId === 'MDExOlB1bGxSZXF1ZN0NjExMzU2MTgy' &&
           body.variables.mergeMethod === 'SQUASH'
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR approved and auto merge rebase is enabled', async () => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels: []
      apply_labels: []
      blacklisted_labels: []
      auto_rebase_merge_labels:
        - merge
    `
    const reviews = require('./fixtures/pull_request_reviews_empty.json')

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dabrady/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    nock('https://api.github.com')
      .post('/graphql', (body: any) => {
        return body.variables.pullRequestId === 'MDExOlB1bGxSZXF1ZN0NjExMzU2MTgy' &&
           body.variables.mergeMethod === 'REBASE'
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR is already approved -> will NOT be approved again', async () => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels: []
      apply_labels:
        - merge
      blacklisted_labels: []
    `
    const reviews = require('./fixtures/pull_request_reviews.json')

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request_review', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('Autoapproval review was dismissed -> approve PR again', async () => {
    const payload = require('./fixtures/pull_request_review.dismissed.json')
    const config = `
      registered_app_slug: 'dummy'
      from_owner:
        - dabrady
      required_labels: []
      apply_labels:
        - merge
      blacklisted_labels: []
    `
    const reviews = require('./fixtures/pull_request_reviews.json')

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/contents/.github%2Fautoapproval.yml')
      .reply(200, config)

    nock('https://api.github.com')
      .get('/repos/dabrady/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dabrady/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    nock('https://api.github.com')
      .post('/repos/dabrady/autoapproval/issues/1/labels', (body: any) => {
        return body.labels.includes('merge')
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request_review', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })

  test('PR labeled when opening -> label event is ignored', async () => {
    const payload = require('./fixtures/pull_request.labeled.on_open.json')

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })

    await new Promise(process.nextTick) // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about using TypeScript in your tests, Jest recommends:
// https://github.com/kulshekhar/ts-jest

// For more information about testing with Nock see:
// https://github.com/nock/nock
