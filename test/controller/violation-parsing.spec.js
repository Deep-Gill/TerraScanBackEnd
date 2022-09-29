// testing libraries
// mocha
const { describe, it} = require('mocha')

// chai
const chai = require('chai')
const expect = chai.expect

const violationParser = require('./src/index').parseViolation

describe('Violation Parsing', () => {

    const prInfoOpened = {
        'user': 'HryChg',
        'url': 'https://github.com/CPSC-319/TerraScanTestData/pull/5',
        'branch': 'General-t1-Synchronized',
        'repoName': 'CPSC-319/TerraScanTestData',
        'localPath': '/mnt/repos/CPSC-319_TerraScanTestData_5/files',
        'commit_sha': 'agaec1921d50764c6430e7af64dd81e2b3345f60c',
        'gitEvent': 'opened',
        'userEmail': 'hanchangchuang@gmail.com',
        'repoPath': '/mnt/repos/CPSC-319_TerraScanTestData_5'
    }

    const prInfoSync = {
        'user': 'HryChg',
        'url': 'https://github.com/CPSC-319/TerraScanTestData/pull/5',
        'branch': 'General-t1-Synchronized',
        'repoName': 'CPSC-319/TerraScanTestData',
        'localPath': '/mnt/repos/CPSC-319_TerraScanTestData_5/files',
        'commit_sha': '03e9b0bca821deb297a31239cb66674a9c34bf7c',
        'gitEvent': 'synchronize',
        'userEmail': 'hanchangchuang@gmail.com',
        'repoPath': '/mnt/repos/CPSC-319_TerraScanTestData_5'
    }

      describe('PR OPENED', () => {

          it('should update valid violation in jobSummary', async () => {
            const jobSummary = { 
                  'failedJobs': [{
                    'status': 'ERROR',
                    'errorMessage': 'No Resources found in terraform file',
                    'results': [],
                    'resultsFixed': [],
                    'date': '11/29/2021, 8:16:46 PM',
                    'prURL': 'https://github.com/CPSC-319/TerraScanTestData/pull/23',
                    'username': 'learese',
                    'filepath': '/mnt/repos/CPSC-319_TerraScanTestData_23/files/data/data.tf',
                    'resFilePath': '/mnt/repos/CPSC-319_TerraScanTestData_23/results/data/data.tf-result.json'
                }],
                  'violationJobs': [{
                    'status': 'VIOLATION',
                    'results': [
                        {
                            'repo_name': 'CPSC-319/yaml-rules-and-terraform-violations',
                            'pull_url': 'https://github.com/CPSC-319/yaml-rules-and-terraform-violations/pull/4',
                            'file_path': '/mnt/repos/CPSC-319_yaml-rules-and-terraform-violations_4/files/general/ensure-that-athena-workgroup-is-encrypted.test.tf',
                            'line_number': 1,
                            'resource_desc': 'test',
                            'resource_name': 'aws_athena_workgroup',
                            'rule_id': 128,
                            'rule_desc': '1.yaml',
                            'user_email': 'some.cpsc319.test@gmail.com',
                            'fixed': false,
                            'commit_sha': '03e9b0bca821deb297a31239cb66674a9c34bf7c'
                        },
                        {
                            'repo_name': 'CPSC-319/yaml-rules-and-terraform-violations',
                            'pull_url': 'https://github.com/CPSC-319/yaml-rules-and-terraform-violations/pull/4',
                            'file_path': '/mnt/repos/CPSC-319_yaml-rules-and-terraform-violations_4/files/general/ensure-that-athena-workgroup-is-encrypted.test.tf',
                            'line_number': 1,
                            'resource_desc': 'test',
                            'resource_name': 'aws_athena_workgroup',
                            'rule_id': 130,
                            'rule_desc': 'ensure-that-athena-workgroup-is-encrypted.yaml',
                            'user_email': 'some.cpsc319.test@gmail.com',
                            'fixed': false,
                            'commit_sha': '03e9b0bca821deb297a31239cb66674a9c34bf7c'
                        }
                    ],
                    'resultsFixed': [{
                        'repo_name': 'CPSC-319/yaml-rules-and-terraform-violations',
                        'pull_url': 'https://github.com/CPSC-319/yaml-rules-and-terraform-violations/pull/4',
                        'file_path': '/mnt/repos/CPSC-319_yaml-rules-and-terraform-violations_4/files/general/ensure-that-athena-workgroup-is-encrypted.test.tf',
                        'line_number': 1,
                        'resource_desc': 'test',
                        'resource_name': 'aws_athena_workgroup',
                        'rule_id': 128,
                        'rule_desc': '1.yaml',
                        'user_email': 'some.cpsc319.test@gmail.com',
                        'fixed': false,
                        'commit_sha': '03e9b0bca821deb297a31239cb66674a9c34bf7c',
                        'violation_id': 1082,
                        'timestamp_found': '2021-12-01T02:43:44.160Z'
                    }],
                    'date': '11/30/2021, 6:43:34 PM',
                    'prURL': 'https://github.com/CPSC-319/yaml-rules-and-terraform-violations/pull/4',
                    'username': 'marquesarthur',
                    'filepath': '/mnt/repos/CPSC-319_yaml-rules-and-terraform-violations_4/files/general/ensure-that-athena-workgroup-is-encrypted.test.tf',
                    'resFilePath': '/mnt/repos/CPSC-319_yaml-rules-and-terraform-violations_4/results/general/ensure-that-athena-workgroup-is-encrypted.test.tf-result.json'
                }],
                  'noViolationJobs': [{
                    'status': 'NOVIOLATION',
                    'results': [],
                    'resultsFixed': [],
                    'date': '11/12/2021, 8:16:47 PM',
                    'prURL': 'https://github.com/CPSC-319/TerraScanTestData/pull/10',
                    'username': 'learese',
                    'filepath': '/mnt/repos/CPSC-319_TerraScanTestData_23/files/modifiedData/subDir1/api_gateway_resources.tf',
                    'resFilePath': '/mnt/repos/CPSC-319_TerraScanTestData_23/results/modifiedData/subDir1/api_gateway_resources.tf-result.json'
                }
                ],
                  'noResultJobs': [
                    '/mnt/repos/CPSC-319_TerraScanTestData_5/results/arthur/general/ensure-that-athena-workgroup-is-encrypted.test.tf',
                    '/mnt/repos/CPSC-319_TerraScanTestData_5/results/data/certificate.tf',
                    '/mnt/repos/CPSC-319_TerraScanTestData_5/results/data/data.tf',
                    '/mnt/repos/CPSC-319_TerraScanTestData_5/results/data/main.tf'
                  ],
                  'fixedJobs': []
              }
              return violationParser(jobSummary, prInfoOpened).then((jobSummaryUpdated) => {

              expect(jobSummaryUpdated.violationJobs[0].status).to.equal('VIOLATION')
              expect(jobSummaryUpdated.violationJobs.length).to.equal(1)
              expect(jobSummaryUpdated.violationJobs[0].results.length).to.equal(2)
              expect(jobSummaryUpdated.violationJobs[0].resultsFixed.length).to.equal(0)
              expect(jobSummaryUpdated.violationJobs[0].results[0].rule_id).to.equal(128)
              expect(jobSummaryUpdated.violationJobs[0].results[0].violation_id).to.exist
              expect(jobSummaryUpdated.violationJobs[0].results[0].timestamp_found).to.exist
              expect(jobSummaryUpdated.violationJobs[0].results[1].rule_id).to.equal(130)
              expect(jobSummaryUpdated.violationJobs[0].results[1].violation_id).to.exist
              expect(jobSummaryUpdated.violationJobs[0].results[1].timestamp_found).to.exist
            })
          })

          it('should not update invalid violation', async () => {
            const jobSummary = { 
                'failedJobs': [{
                  'status': 'ERROR',
                  'errorMessage': 'No Resources found in terraform file',
                  'results': [],
                  'resultsFixed': [],
                  'date': '11/29/2021, 8:16:46 PM',
                  'prURL': 'https://github.com/CPSC-319/TerraScanTestData/pull/23',
                  'username': 'learese',
                  'filepath': '/mnt/repos/CPSC-319_TerraScanTestData_23/files/data/data.tf',
                  'resFilePath': '/mnt/repos/CPSC-319_TerraScanTestData_23/results/data/data.tf-result.json'
              }],
                'violationJobs': [{
                  'status': 'VIOLATION',
                  'results': [
                      {
                          'repo_name': 'CPSC-319/yaml-rules-and-terraform-violations',
                          'pull_url': 'https://github.com/CPSC-319/yaml-rules-and-terraform-violations/pull/4',
                          'file_path': '/mnt/repos/CPSC-319_yaml-rules-and-terraform-violations_4/files/general/ensure-that-athena-workgroup-is-encrypted.test.tf',
                          'fixed': false,
                          'commit_sha': '03e9b0bca821deb297a31239cb66674a9c34bf7c'
                      },
                      {
                        'repo_name': 'CPSC-319/yaml-rules-and-terraform-violations',
                        'pull_url': 'https://github.com/CPSC-319/yaml-rules-and-terraform-violations/pull/4',
                        'file_path': '/mnt/repos/CPSC-319_yaml-rules-and-terraform-violations_4/files/general/ensure-that-athena-workgroup-is-encrypted.test.tf',
                        'line_number': 1,
                        'resource_desc': 'test',
                        'resource_name': 'aws_athena_workgroup',
                        'rule_id': 128,
                        'rule_desc': '1.yaml',
                        'user_email': 'some.cpsc319.test@gmail.com',
                        'fixed': false,
                        'commit_sha': '03e9b0bca821deb297a31239cb66674a9c34bf7c'
                    }
                  ],
                  'resultsFixed': [{
                      'repo_name': 'CPSC-319/yaml-rules-and-terraform-violations',
                      'pull_url': 'https://github.com/CPSC-319/yaml-rules-and-terraform-violations/pull/4',
                      'file_path': '/mnt/repos/CPSC-319_yaml-rules-and-terraform-violations_4/files/general/ensure-that-athena-workgroup-is-encrypted.test.tf',
                      'line_number': 1,
                      'resource_desc': 'test',
                      'resource_name': 'aws_athena_workgroup',
                      'rule_id': 128,
                      'rule_desc': '1.yaml',
                      'user_email': 'some.cpsc319.test@gmail.com',
                      'fixed': true,
                      'commit_sha': '03e9b0bca821deb297a31239cb66674a9c34bf7c',
                      'violation_id': 1082,
                      'timestamp_found': '2021-12-01T02:43:44.160Z'
                  }],
                  'date': '11/30/2021, 6:43:34 PM',
                  'prURL': 'https://github.com/CPSC-319/yaml-rules-and-terraform-violations/pull/4',
                  'username': 'marquesarthur',
                  'filepath': '/mnt/repos/CPSC-319_yaml-rules-and-terraform-violations_4/files/general/ensure-that-athena-workgroup-is-encrypted.test.tf',
                  'resFilePath': '/mnt/repos/CPSC-319_yaml-rules-and-terraform-violations_4/results/general/ensure-that-athena-workgroup-is-encrypted.test.tf-result.json'
              }],
                'noViolationJobs': [{
                  'status': 'NOVIOLATION',
                  'results': [],
                  'resultsFixed': [],
                  'date': '11/12/2021, 8:16:47 PM',
                  'prURL': 'https://github.com/CPSC-319/TerraScanTestData/pull/10',
                  'username': 'learese',
                  'filepath': '/mnt/repos/CPSC-319_TerraScanTestData_23/files/modifiedData/subDir1/api_gateway_resources.tf',
                  'resFilePath': '/mnt/repos/CPSC-319_TerraScanTestData_23/results/modifiedData/subDir1/api_gateway_resources.tf-result.json'
              }
              ],
                'noResultJobs': [],
                'fixedJobs': []
            }

            return violationParser(jobSummary, prInfoOpened).then((jobSummaryUpdated) => {

            expect(jobSummaryUpdated.violationJobs[0].status).to.equal('VIOLATION')
            expect(jobSummaryUpdated.violationJobs.length).to.equal(1)
            // GEt only 1 valid violation job 
            expect(jobSummaryUpdated.violationJobs[0].results.length).to.equal(2)
            expect(jobSummaryUpdated.violationJobs[0].results[1].rule_id).to.equal(128)
            expect(jobSummaryUpdated.violationJobs[0].results[1].violation_id).to.exist
            expect(jobSummaryUpdated.violationJobs[0].results[1].timestamp_found).to.exist

            // FOR invalid violation, no id or timestamp
            expect(jobSummaryUpdated.violationJobs[0].results[0].violation_id).to.undefined
            expect(jobSummaryUpdated.violationJobs[0].results[0].timestamp_found).to.undefined
            expect(jobSummaryUpdated.noResultJobs.length).to.equal(1)
            expect(jobSummaryUpdated.violationJobs[0].results[1].violation_id).to.exist
            expect(jobSummaryUpdated.violationJobs[0].results[1].timestamp_found).to.exist
            })
          })

      })
})
      
