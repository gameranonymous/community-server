include apt

group { 'discourse':
  ensure => 'present',
}

user { 'discourse':
  ensure      => 'present',
  shell       => '/bin/bash',
  home        => '/home/discourse',
  managehome  => true,
  require     => [Group["discourse"]]
}

include rvm

rvm::system_user { discourse: ; }

rvm_system_ruby {
  '2.0.0-p481':
    ensure      => present,
    default_use => true;
}
rvm_gemset {
  '2.0.0-p481@discourse':
    ensure  => present,
    require => Rvm_system_ruby['2.0.0-p481'];
}
rvm_gem {
  '2.0.0-p481@discourse/bundler':
    require => Rvm_gemset['2.0.0-p481@discourse'];
}


$environment_file  = "/etc/environment"
$postgres_username = 'discourse'
$postgres_password = 'discourse'
$postgres_host     = "127.0.0.1"
$postgres_port     = "5432"
$postgres_db       = "discourse"
$port_to_bind_to   = "4567"

class { 'postgresql::server': }

postgresql::server::role { $postgres_username:
  password_hash => postgresql_password($postgres_username, $postgres_password),
  superuser     => true,
  require       => Package['postgresql-contrib']
}
postgresql::server::db { $postgres_db:
  require   => Postgresql::Server::Role[$postgres_username],
  user      => $postgres_username,
  password  => $postgres_password,
}
concat{$environment_file:
  owner => root,
  group => root,
  mode  => '0644',
}
concat::fragment{"env_path":
  target  => $environment_file,
  content => "PATH=\"/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games\"\n",
  order   => 1,
}
concat::fragment{"env_postgres_url":
  target  => $environment_file,
  content => "POSTGRES_STRING=\"postgres://$postgres_username:$postgres_password@$postgres_host:$postgres_port/$postgres_db\"\n",
  order   => 1,
  require => Postgresql::Server::Db[$postgres_db],
}
concat::fragment{"env_binding_port":
  target  => $environment_file,
  content => "PORT_TO_BIND_TO=\"$port_to_bind_to\"\n",
  order   => 1,
  require => Postgresql::Server::Db[$postgres_db],
}

package { "git":
  ensure => "installed",
}

package { "libpq-dev":
  ensure => "installed",
}

package { "postgresql-contrib":
  ensure => "installed"
}

package { "nginx":
  ensure => "installed"
}

class { 'redis':
  version            => '2.8.14',
}

redis::instance { 'redis-6900':
  redis_port         => '6900',
  redis_bind_address => '127.0.0.1',
  redis_password     => "one",
  redis_max_memory   => '256mb',
}

file { ["/var/www"]:
  ensure  => 'directory',
  owner   => 'root',
  group   => 'root',
  mode    => "0777"
}

file { ["/var/www/discourse"]:
  ensure  => 'directory',
  owner   => 'discourse',
  group   => 'discourse',
  mode    => "0755",
  require => User["discourse"]
}

file { ["/var/www/discourse/config/discourse.conf"]:
  ensure  => 'file',
  owner   => 'discourse',
  group   => 'discourse',
  mode    => "0755",
  source  => 'puppet:///modules/toast/discourse.conf',
  require => Vcsrepo['/var/www/discourse']
}

file { ["/etc/nginx/discourse.conf"]:
  ensure  => 'file',
  owner   => 'discourse',
  group   => 'discourse',
  mode    => "0755",
  source  => 'puppet:///modules/toast/discourse.nginx.conf',
  require => [Vcsrepo['/var/www/discourse'], Package['nginx']],
}

file { ["/var/www/discourse/config/discourse.pill"]:
  ensure  => 'file',
  owner   => 'discourse',
  group   => 'discourse',
  mode    => "0755",
  source  => 'puppet:///modules/toast/discourse.pill',
  require => Vcsrepo['/var/www/discourse'],
}

vcsrepo { "/var/www/discourse":
  ensure    => present,
  provider  => git,
  source    => "git://github.com/discourse/discourse.git",
  user      => "discourse",
  revision  => "latest-release",
  require   => [User["discourse"],File["/var/www/discourse"]]
}

exec { "bundle_install":
  command => "/usr/local/rvm/bin/rvm 2.0.0-p481@discourse do bundle install --deployment --without test",
  cwd     => "/var/www/discourse",
  user    => "discourse",
  timeout => 0,
  require => [
    Vcsrepo["/var/www/discourse"],
    Rvm_gemset['2.0.0-p481@discourse'],
    Package["libpq-dev"]
    ]
}

exec { "rake_db_migrate":
  command     => "/usr/local/rvm/bin/rvm 2.0.0-p481@discourse do bundle exec rake db:migrate",
  cwd         => "/var/www/discourse",
  user        => "discourse",
  timeout     => 0,
  environment => ["RAILS_ENV=production"],
  require     => [
    Vcsrepo["/var/www/discourse"],
    Rvm_gemset['2.0.0-p481@discourse'],
    Package["libpq-dev"],
    File["/var/www/discourse/config/discourse.conf"],
    Exec['bundle_install']
    ]
}

exec { "asset precompile":
  command     => "/usr/local/rvm/bin/rvm 2.0.0-p481@discourse do bundle exec rake assets:precompile",
  environment => ["RAILS_ENV=production"],
  cwd         => "/var/www/discourse",
  user        => "discourse",
  logoutput   => true,
  require     => Exec["rake_db_migrate"],
}

exec { "rails s":
  command     => "/usr/local/rvm/bin/rvm 2.0.0-p481@discourse do bundle exec rails s",
  environment => ["RAILS_ENV=production"],
  cwd         => "/var/www/discourse",
  user        => "discourse",
  logoutput   => true,
  require     => [Exec["asset precompile"],
    Package["nginx"]],
}

file { "/home/discourse/.bash_aliases":
  owner   => "discourse",
  content => 'alias bluepill="NOEXEC_DISABLE=1 bluepill --no-privileged -c ~/.bluepill"'
}

cron { bluepill:
  command => "RUBY_GC_MALLOC_LIMIT=90000000 RAILS_ROOT=/var/www/discourse RAILS_ENV=production NUM_WEBS=2 /home/discourse/.rvm/bin/bootup_bluepill --no-privileged -c ~/.bluepill load /var/www/discourse/config/discourse.pill",
  user    => 'discourse',
  ensure  => "present",
  special => 'reboot',
}

