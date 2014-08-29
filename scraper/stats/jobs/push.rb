require "sequel"

class DatabaseQueries
  def initialize
    @connection = Sequel.connect(ENV.fetch("POSTGRES_STRING"))
  end

  def scraped_users
    @connection.fetch("SELECT count(*) from lastfm_users").first.fetch(:count)
  end

  def scraped_scrobbles
    @connection.fetch("SELECT count(*) from lastfm_scrobbles").first.fetch(:count)
  end

  def unique_tracks
    @connection.fetch("SELECT count(*) from (select distinct lastfm_track_path from lastfm_scrobbles) sub").first.fetch(:count)
  end

  def scrobble_density
    unique_pairs = @connection.fetch("SELECT count(*) from (select distinct (lastfm_track_path,lastfm_user_id) from lastfm_scrobbles) sub").first.fetch(:count)
    unique_pairs * 1.0 / (scraped_users * unique_tracks)
  end

  private

  attr_reader :connection
end

class Workers
  def initialize

  end

  def count
    `ps aux | grep -i 'python' | grep -v 'grep' | wc -l`.strip.to_i
  end
end

SCHEDULER.every '1m', :first_in => 0 do |job|
  queries = DatabaseQueries.new
  workers = Workers.new
  send_event('users', {:current => queries.scraped_users})
  send_event('scrobbles', {:current => queries.scraped_scrobbles})
  send_event('unique_tracks', {:current => queries.unique_tracks})
  send_event('density', {:current => (queries.scrobble_density*100).round(3)})
  send_event('workers', {:current => workers.count})
end
