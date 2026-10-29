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
    string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'Only this multibranch branch may deploy.')
    string(name: 'APP_PORT', defaultValue: '3000', description: 'Host port for the demo application.')
    string(name: 'BIND_ADDRESS', defaultValue: '127.0.0.1', description: 'Keep loopback for an SSH tunnel; use 0.0.0.0 only for a controlled demo.')
  }
  environment {
    COMPOSE_PROJECT_NAME = 'jack-fruit-devops'
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
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
        script { env.APP_IMAGE = "jack-fruit-devops:build-${env.BUILD_NUMBER}" }
        sh 'docker build --tag "$APP_IMAGE" .'
      }
    }
    stage('Deploy') {
      when { expression { params.DEPLOY_ENABLED && env.BRANCH_NAME == params.DEPLOY_BRANCH } }
      steps {
        withEnv(["APP_PORT=${params.APP_PORT}", "BIND_ADDRESS=${params.BIND_ADDRESS}"]) {
          sh 'docker compose -p "$COMPOSE_PROJECT_NAME" config --quiet'
          sh 'docker compose -p "$COMPOSE_PROJECT_NAME" up -d --no-build --wait --wait-timeout 90'
        }
      }
    }
    stage('Post-Deploy Health Check') {
      when { expression { params.DEPLOY_ENABLED && env.BRANCH_NAME == params.DEPLOY_BRANCH } }
      steps {
        sh 'docker compose -p "$COMPOSE_PROJECT_NAME" exec -T app node scripts/healthcheck.js'
      }
    }
  }
  post {
    success { echo 'All requested pipeline stages passed. Deployment is gated by branch and DEPLOY_ENABLED.' }
    failure { echo 'Pipeline failed. Later stages were skipped. Inspect console logs; no production volume is deleted.' }
    always {
      archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true, fingerprint: true
    }
  }
}
