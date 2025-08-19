import { Injectable, Logger } from '@nestjs/common';
import { GroupByOption } from '../dtos/export-config.dto';

export interface AggregationResult {
  period: string;
  metrics: {
    total_trips: number;
    completed_trips: number;
    cancelled_trips: number;
    total_tasks: number;
    completed_tasks: number;
    average_completion_rate: number;
    average_duration_days: number;
    total_distance_km: number;
  };
  breakdown?: Record<string, any>;
}

export interface DashboardSummary {
  overview: {
    active_trips: number;
    pending_trips: number;
    completed_trips: number;
    total_employees: number;
    active_employees: number;
  };
  performance: {
    trip_completion_rate: number;
    task_completion_rate: number;
    average_trip_duration: number;
    on_time_completion_rate: number;
  };
  trends: {
    trips_this_month: number;
    trips_last_month: number;
    growth_percentage: number;
  };
}

export interface PerformanceMetrics {
  employee_id?: string;
  period: string;
  trips_completed: number;
  tasks_completed: number;
  total_distance_km: number;
  average_trip_duration_days: number;
  completion_rate: number;
  on_time_rate: number;
  efficiency_score: number;
}

@Injectable()
export class ReportAggregationService {
  private readonly logger = new Logger(ReportAggregationService.name);

  async aggregateTripData(
    trips: any[],
    groupBy: GroupByOption,
    dateRange: { from: string; to: string }
  ): Promise<AggregationResult[]> {
    this.logger.log(`Aggregating trip data by ${groupBy}`);
    
    const grouped = this.groupData(trips, groupBy);
    const results: AggregationResult[] = [];

    for (const [key, groupTrips] of Object.entries(grouped)) {
      const tasks = await this.getTasksForTrips(groupTrips as any[]);
      
      results.push({
        period: key,
        metrics: this.calculateMetrics(groupTrips as any[], tasks),
        breakdown: this.getBreakdown(groupTrips as any[], groupBy),
      });
    }

    return results;
  }

  async aggregateTaskData(
    tasks: any[],
    groupBy: GroupByOption,
    dateRange: { from: string; to: string }
  ): Promise<AggregationResult[]> {
    this.logger.log(`Aggregating task data by ${groupBy}`);
    
    const grouped = this.groupData(tasks, groupBy);
    const results: AggregationResult[] = [];

    for (const [key, groupTasks] of Object.entries(grouped)) {
      results.push({
        period: key,
        metrics: this.calculateTaskMetrics(groupTasks as any[]),
        breakdown: this.getTaskBreakdown(groupTasks as any[], groupBy),
      });
    }

    return results;
  }

  async generateDashboardSummary(
    trips: any[],
    tasks: any[],
    employees: any[]
  ): Promise<DashboardSummary> {
    const now = new Date();
    const thisMonth = this.getMonthTrips(trips, now);
    const lastMonth = this.getMonthTrips(trips, new Date(now.getFullYear(), now.getMonth() - 1));

    const activeTrips = trips.filter(t => t.status === 'in_progress').length;
    const pendingTrips = trips.filter(t => t.status === 'pending').length;
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    const tripCompletionRate = trips.length > 0 ? (completedTrips / trips.length) * 100 : 0;
    const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    const avgDuration = this.calculateAverageDuration(trips.filter(t => t.status === 'completed'));
    const onTimeRate = this.calculateOnTimeRate(trips.filter(t => t.status === 'completed'));

    const activeEmployees = new Set(trips.filter(t => t.status === 'in_progress').map(t => t.assignee_id)).size;
    const growthPercentage = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return {
      overview: {
        active_trips: activeTrips,
        pending_trips: pendingTrips,
        completed_trips: completedTrips,
        total_employees: employees.length,
        active_employees: activeEmployees,
      },
      performance: {
        trip_completion_rate: Number(tripCompletionRate.toFixed(2)),
        task_completion_rate: Number(taskCompletionRate.toFixed(2)),
        average_trip_duration: avgDuration,
        on_time_completion_rate: onTimeRate,
      },
      trends: {
        trips_this_month: thisMonth,
        trips_last_month: lastMonth,
        growth_percentage: Number(growthPercentage.toFixed(2)),
      },
    };
  }

  async calculatePerformanceMetrics(
    employeeId: string | undefined,
    trips: any[],
    tasks: any[],
    dateRange: { from: string; to: string }
  ): Promise<PerformanceMetrics[]> {
    const metrics: PerformanceMetrics[] = [];
    
    if (employeeId) {
      const employeeTrips = trips.filter(t => t.assignee_id === employeeId);
      const employeeTasks = tasks.filter(t => t.assignee_id === employeeId);
      
      metrics.push(this.calculateEmployeeMetrics(employeeId, employeeTrips, employeeTasks, dateRange));
    } else {
      // Calculate metrics for all employees
      const employeeIds = new Set([
        ...trips.map(t => t.assignee_id),
        ...tasks.map(t => t.assignee_id),
      ]);

      for (const id of employeeIds) {
        const employeeTrips = trips.filter(t => t.assignee_id === id);
        const employeeTasks = tasks.filter(t => t.assignee_id === id);
        
        metrics.push(this.calculateEmployeeMetrics(id, employeeTrips, employeeTasks, dateRange));
      }
    }

    return metrics;
  }

  private calculateEmployeeMetrics(
    employeeId: string,
    trips: any[],
    tasks: any[],
    dateRange: { from: string; to: string }
  ): PerformanceMetrics {
    const completedTrips = trips.filter(t => t.status === 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    const totalDistance = completedTrips.reduce((sum, trip) => {
      return sum + (trip.total_distance_km || 0);
    }, 0);

    const avgDuration = this.calculateAverageDuration(completedTrips);
    const completionRate = trips.length > 0 ? (completedTrips.length / trips.length) * 100 : 0;
    const onTimeRate = this.calculateOnTimeRate(completedTrips);
    
    // Calculate efficiency score (weighted combination of metrics)
    const efficiencyScore = this.calculateEfficiencyScore({
      completionRate,
      onTimeRate,
      taskCompletionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
    });

    return {
      employee_id: employeeId,
      period: `${dateRange.from} to ${dateRange.to}`,
      trips_completed: completedTrips.length,
      tasks_completed: completedTasks.length,
      total_distance_km: Number(totalDistance.toFixed(2)),
      average_trip_duration_days: avgDuration,
      completion_rate: Number(completionRate.toFixed(2)),
      on_time_rate: onTimeRate,
      efficiency_score: efficiencyScore,
    };
  }

  private groupData(data: any[], groupBy: GroupByOption): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    data.forEach(item => {
      let key: string;
      
      switch (groupBy) {
        case GroupByOption.DAY:
          key = new Date(item.created_at).toISOString().split('T')[0];
          break;
        case GroupByOption.WEEK:
          key = this.getWeekKey(new Date(item.created_at));
          break;
        case GroupByOption.MONTH:
          key = this.getMonthKey(new Date(item.created_at));
          break;
        case GroupByOption.TRIP:
          key = item.trip_id || item.id;
          break;
        case GroupByOption.EMPLOYEE:
          key = item.assignee_id || item.employee_id;
          break;
        case GroupByOption.DEPARTMENT:
          key = item.department || 'Unknown';
          break;
        default:
          key = 'all';
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  }

  private calculateMetrics(trips: any[], tasks: any[]): AggregationResult['metrics'] {
    const completedTrips = trips.filter(t => t.status === 'completed');
    const cancelledTrips = trips.filter(t => t.status === 'cancelled');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    const totalDistance = trips.reduce((sum, trip) => sum + (trip.total_distance_km || 0), 0);
    const avgDuration = this.calculateAverageDuration(completedTrips);
    const completionRate = trips.length > 0 
      ? ((completedTrips.length + completedTasks.length) / (trips.length + tasks.length)) * 100
      : 0;

    return {
      total_trips: trips.length,
      completed_trips: completedTrips.length,
      cancelled_trips: cancelledTrips.length,
      total_tasks: tasks.length,
      completed_tasks: completedTasks.length,
      average_completion_rate: Number(completionRate.toFixed(2)),
      average_duration_days: avgDuration,
      total_distance_km: Number(totalDistance.toFixed(2)),
    };
  }

  private calculateTaskMetrics(tasks: any[]): AggregationResult['metrics'] {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const cancelledTasks = tasks.filter(t => t.status === 'cancelled');
    const avgProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / (tasks.length || 1);

    return {
      total_trips: 0,
      completed_trips: 0,
      cancelled_trips: 0,
      total_tasks: tasks.length,
      completed_tasks: completedTasks.length,
      average_completion_rate: Number(avgProgress.toFixed(2)),
      average_duration_days: 0,
      total_distance_km: 0,
    };
  }

  private getBreakdown(trips: any[], groupBy: GroupByOption): Record<string, any> {
    const breakdown: Record<string, any> = {};

    if (groupBy === GroupByOption.EMPLOYEE) {
      breakdown.top_performers = this.getTopPerformers(trips);
    }

    breakdown.status_distribution = this.getStatusDistribution(trips);
    breakdown.location_distribution = this.getLocationDistribution(trips);

    return breakdown;
  }

  private getTaskBreakdown(tasks: any[], groupBy: GroupByOption): Record<string, any> {
    return {
      status_distribution: this.getStatusDistribution(tasks),
      progress_distribution: this.getProgressDistribution(tasks),
      priority_distribution: this.getPriorityDistribution(tasks),
    };
  }

  private getTopPerformers(trips: any[]): any[] {
    const performerMap = new Map<string, number>();
    
    trips.forEach(trip => {
      if (trip.status === 'completed' && trip.assignee_id) {
        const count = performerMap.get(trip.assignee_id) || 0;
        performerMap.set(trip.assignee_id, count + 1);
      }
    });

    return Array.from(performerMap.entries())
      .map(([id, count]) => ({ employee_id: id, completed_trips: count }))
      .sort((a, b) => b.completed_trips - a.completed_trips)
      .slice(0, 5);
  }

  private getStatusDistribution(data: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    data.forEach(item => {
      const status = item.status || 'unknown';
      distribution[status] = (distribution[status] || 0) + 1;
    });

    return distribution;
  }

  private getLocationDistribution(trips: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    trips.forEach(trip => {
      const location = trip.location || 'unknown';
      distribution[location] = (distribution[location] || 0) + 1;
    });

    return distribution;
  }

  private getProgressDistribution(tasks: any[]): Record<string, number> {
    const ranges = {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-100%': 0,
    };

    tasks.forEach(task => {
      const progress = task.progress || 0;
      if (progress <= 25) ranges['0-25%']++;
      else if (progress <= 50) ranges['26-50%']++;
      else if (progress <= 75) ranges['51-75%']++;
      else ranges['76-100%']++;
    });

    return ranges;
  }

  private getPriorityDistribution(tasks: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    tasks.forEach(task => {
      const priority = task.priority || 'normal';
      distribution[priority] = (distribution[priority] || 0) + 1;
    });

    return distribution;
  }

  private calculateAverageDuration(trips: any[]): number {
    if (trips.length === 0) return 0;

    const totalDuration = trips.reduce((sum, trip) => {
      if (trip.start_date && trip.end_date) {
        const start = new Date(trip.start_date).getTime();
        const end = new Date(trip.end_date).getTime();
        return sum + (end - start) / (1000 * 60 * 60 * 24); // Convert to days
      }
      return sum;
    }, 0);

    return Number((totalDuration / trips.length).toFixed(2));
  }

  private calculateOnTimeRate(trips: any[]): number {
    if (trips.length === 0) return 0;

    const onTimeTrips = trips.filter(trip => {
      if (trip.end_date && trip.planned_end_date) {
        return new Date(trip.end_date) <= new Date(trip.planned_end_date);
      }
      return false;
    });

    return Number(((onTimeTrips.length / trips.length) * 100).toFixed(2));
  }

  private calculateEfficiencyScore(metrics: {
    completionRate: number;
    onTimeRate: number;
    taskCompletionRate: number;
  }): number {
    // Weighted average of different metrics
    const weights = {
      completion: 0.4,
      onTime: 0.3,
      taskCompletion: 0.3,
    };

    const score = 
      metrics.completionRate * weights.completion +
      metrics.onTimeRate * weights.onTime +
      metrics.taskCompletionRate * weights.taskCompletion;

    return Number(score.toFixed(2));
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const weekNumber = this.getWeekNumber(date);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  private getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private getMonthTrips(trips: any[], date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    return trips.filter(trip => {
      const tripDate = new Date(trip.created_at);
      return tripDate.getFullYear() === year && tripDate.getMonth() === month;
    }).length;
  }

  private async getTasksForTrips(trips: any[]): Promise<any[]> {
    // This would normally fetch tasks from the task service
    // For now, returning empty array as placeholder
    return [];
  }
}