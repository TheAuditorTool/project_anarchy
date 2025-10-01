# ERROR 278: Ruby deployment script in polyglot project
# Deployment language mismatch

def deploy_application
  puts "Deploying polyglot application..."
  system("docker-compose up -d")
end

deploy_application