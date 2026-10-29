pipeline {
  agent any
  options {
    disableConcurrentBuilds()
    timestamps()
    timeout(time: 20, unit: 'MINUTES')
    skipDefaultCheckout(true)
  }
  parameters {
    booleanParam(name: 'DEPLOY_ENABLED', defaultValue: false, description: 'Enable only on the intended Ubuntu Docker deployment agent.')
    string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'Must remain main; any other value disables deployment.')
    string(name: 'APP_PORT', defaultValue: '3000', description: 'Host port for the demo application.')
    string(name: 'BIND_ADDRESS', defaultValue: '127.0.0.1', description: 'Keep loopback for an SSH tunnel; use 0.0.0.0 only for a controlled demo.')
  }
  environment {
    COMPOSE_PROJECT_NAME = 'jack-fruit-devops'
  }
  stages {
    stage('Checkout') {
      steps {
        script {
          env.CHECKED_OUT_MAIN = 'false'
          env.BUILT_APP_IMAGE = ''
          env.DEPLOY_COMPLETED = 'false'
          def checkedOut = checkout scm
          env.SOURCE_COMMIT = sh(script: 'git rev-parse --verify HEAD', returnStdout: true).trim()
          def mainCommit = sh(
            script: 'git rev-parse --verify refs/remotes/origin/main 2>/dev/null || true',
            returnStdout: true
          ).trim()
          // Git Plugin reports the selected SCM branch even with a detached HEAD.
          // Missing metadata/ref, another branch, or a revision mismatch fails closed.
          env.CHECKED_OUT_MAIN = (
            checkedOut.GIT_BRANCH in ['origin/main', 'refs/remotes/origin/main', 'main', 'refs/heads/main'] &&
            checkedOut.GIT_COMMIT == env.SOURCE_COMMIT &&
            mainCommit == env.SOURCE_COMMIT
          ).toString()
          echo "Verified checkout for main deployment: ${env.CHECKED_OUT_MAIN}"
        }
      }
    }
    stage('Install') {
      steps {
        sh 'node --version | grep -E "^v22[.]"'
        sh 'npm ci'
      }
    }
    stage('Test') { steps { sh 'npm test' } }
    stage('Build') {
      steps {
        sh 'npm run build'
        script {
          def image = "jack-fruit-devops:build-${env.BUILD_NUMBER}"
          withEnv(["APP_IMAGE=${image}"]) {
            sh 'docker build --tag "$APP_IMAGE" .'
          }
          // Publish the image to later stages only after docker build succeeds.
          env.BUILT_APP_IMAGE = image
        }
      }
    }
    stage('Deploy') {
      when {
        expression {
          def causes = currentBuild.getBuildCauses()
          // Require positive, exclusive cause evidence; mixed/unknown causes fail closed.
          def polling = causes && causes.every { it._class == 'hudson.triggers.SCMTrigger$SCMTriggerCause' }
          def manual = causes && causes.every { it._class == 'hudson.model.Cause$UserIdCause' }
          (polling || (manual && params.DEPLOY_ENABLED)) && params.DEPLOY_BRANCH == 'main' &&
            env.CHECKED_OUT_MAIN == 'true' && env.BUILT_APP_IMAGE?.trim()
        }
      }
      steps {
        withEnv(["APP_IMAGE=${env.BUILT_APP_IMAGE}", "APP_PORT=${params.APP_PORT}", "BIND_ADDRESS=${params.BIND_ADDRESS}"]) {
          sh '''
            set -eu
            test "$(git rev-parse --verify HEAD)" = "$SOURCE_COMMIT"
            test "$(git rev-parse --verify refs/remotes/origin/main)" = "$SOURCE_COMMIT"
            : "${APP_IMAGE:?Successful Docker Build image is required}"
            docker image inspect "$APP_IMAGE" >/dev/null
          '''
          sh 'docker compose -p "$COMPOSE_PROJECT_NAME" config --quiet'
          sh 'docker compose -p "$COMPOSE_PROJECT_NAME" up -d --no-build --wait --wait-timeout 90'
        }
        script { env.DEPLOY_COMPLETED = 'true' }
      }
    }
    stage('Post-Deploy Health Check') {
      when { expression { env.DEPLOY_COMPLETED == 'true' } }
      steps {
        withEnv(["APP_IMAGE=${env.BUILT_APP_IMAGE}", "APP_PORT=${params.APP_PORT}", "BIND_ADDRESS=${params.BIND_ADDRESS}"]) {
          sh 'docker compose -p "$COMPOSE_PROJECT_NAME" exec -T app node scripts/healthcheck.js'
        }
      }
    }
  }
  post {
    success { echo 'All requested pipeline stages passed. Deployment requires verified main and SCM polling or an explicitly enabled manual build.' }
    failure { echo 'Pipeline failed. Later stages were skipped. Inspect console logs; no production volume is deleted.' }
    always {
      archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true, fingerprint: true
    }
  }
}
