include apt
apt::ppa{'ppa:brightbox/ruby-ng-experimental':}

$environment_file  = "/etc/environment"
$postgres_username = 'one'
$postgres_password = 'one'
$postgres_host     = "127.0.0.1"
$postgres_port     = "5432"
$postgres_db       = "one"
$port_to_bind_to   = "4567"

class { 'ruby':
  gems_version => 'latest',
  ruby_package => 'ruby2.1',
  require      => Apt::Ppa['ppa:brightbox/ruby-ng-experimental'],
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

package { "ruby2.1-dev":
  ensure  => "installed",
  require => Class["ruby"],
}

package { "libpq-dev":
  ensure  => "installed",
  require => Package["ruby2.1-dev"],
}

package { "python-pip":
  ensure => "installed",
}

package { "git":
  ensure => "installed",
}

package { "python-dev":
  ensure => "installed",
}

package { "python-virtualenv":
  ensure => "installed",
}

package { "nodejs-legacy":
  ensure => "installed",
}

exec { "gem install bundler":
  require => Package["ruby2.1-dev"],
  cwd     => '/tmp',
  path    => ['/usr/bin'],
}
