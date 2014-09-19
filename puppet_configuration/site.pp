include apt
include rvm

$environment_file  = "/etc/environment"
$postgres_username = 'one'
$postgres_password = 'one'
$postgres_host     = "127.0.0.1"
$postgres_port     = "5432"
$postgres_db       = "one"
$port_to_bind_to   = "4567"

rvm_system_ruby {
  'ruby-2.0.0-p353':
    ensure      => 'present',
    default_use => true;
}

rvm_gemset {
  'ruby-2.0.0-p353@discourse':
    ensure  => present,
    require => Rvm_system_ruby['ruby-2.0.0-p353'];
}

rvm_gem {
  'ruby-2.0.0-p353@discourse/bundler':
    ensure  => '1.0.21',
    require => Rvm_gemset['ruby-2.0.0-p353@discourse'];
}

class { 'postgresql::server': }

postgresql::server::role { $postgres_username:
  password_hash => postgresql_password($postgres_username, $postgres_password),
  superuser     => true,
}

postgresql::server::db { $postgres_db:
  require => Postgresql::Server::Role[$postgres_username],
  user => $postgres_username,
  password => $postgres_password,
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

class { 'redis':
  version            => '2.8.14',
}

redis::instance { 'redis-6900':
  redis_port         => '6900',
  redis_bind_address => '127.0.0.1',
  redis_password     => "one",
  redis_max_memory   => '256mb',
}

group { 'discourse':
  ensure => 'present',
}

user { 'discourse':
  ensure => 'present',
  shell => '/bin/bash',
  home => '/home/discourse',
  managehome => true,
  require => [Group["discourse"]]
}

file { ["/var/www"]:
  ensure => 'directory',
  owner => 'root',
  group => 'root',
  mode => "0777"
}

file { ["/var/www/discourse"]:
  ensure => 'directory',
  owner => 'discourse',
  group => 'discourse',
  mode => "0755",
  require => User["discourse"]
}

vcsrepo { "/var/www/discourse":
  ensure => present,
  provider => git,
  source => "git://github.com/discourse/discourse.git",
  user => "discourse",
  revision => "latest-release",
  require => [User["discourse"],File["/var/www/discourse"]]
}
